from fastapi import APIRouter, Query, HTTPException, Depends, status
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from datetime import datetime
import uuid
import os

from ..db import get_db
from ..models.receipt import Receipt
from ..models.labtest import LabTest
from ..models.report import Report, FinalStatus
from ..models.invoice import Invoice, InvoiceStatus
from ..models.owner import RetestRequest, OwnerPreference
from ..schemas.owner import (
    TrackingQuery, TrackingResult, TimelineStep,
    RetestRequestCreate, RetestRequestRead,
    OwnerPreferenceUpdate, OwnerPreferenceRead,
    OwnerDocumentList
)
from .auth import get_owner_user

router = APIRouter(tags=["owner"])

# Rate limiting would be implemented here in production
# For now, we'll use a simple in-memory store
tracking_requests = {}

TIMELINE_STEPS = [
    "received",
    "forwarded", 
    "central",
    "lab_queued",
    "in_progress",
    "completed",
    "report_ready",
    "approved",
    "communicated",
    "invoiced",
    "paid"
]


@router.get("/track", response_model=TrackingResult)
async def track_shipment(
    query: str = Query(..., description="AWB, Receipt ID, Report ID, or Invoice ID"),
    db: AsyncSession = Depends(get_db)
):
    """Public tracking endpoint with rate limiting"""
    
    # Basic rate limiting check (in production, use Redis)
    # For development, we'll allow unlimited requests
    
    tracking_result = TrackingResult(found=False)
    
    # Try to find the item by different identifiers
    receipt = None
    labtest = None
    report = None
    invoice = None
    
    # Search by AWB (courier tracking number)
    if not receipt:
        result = await db.execute(
            select(Receipt).where(Receipt.courier_awb == query)
        )
        receipt = result.scalar_one_or_none()
    
    # Search by Receipt ID
    if not receipt:
        result = await db.execute(
            select(Receipt).where(Receipt.id == query)
        )
        receipt = result.scalar_one_or_none()
    
    # Search by Lab Test ID
    if not receipt:
        labtest_result = await db.execute(
            select(LabTest)
            .options(selectinload(LabTest.receipt))
            .where(LabTest.id == query)
        )
        labtest = labtest_result.scalar_one_or_none()
        if labtest:
            receipt = labtest.receipt
    
    # Search by Report ID
    if not receipt:
        report_result = await db.execute(
            select(Report)
            .options(selectinload(Report.labtest).selectinload(LabTest.receipt))
            .where(Report.id == query)
        )
        report = report_result.scalar_one_or_none()
        if report:
            labtest = report.labtest
            receipt = labtest.receipt if labtest else None
    
    # Search by Invoice ID or Invoice Number
    if not receipt:
        # Try by invoice number first
        result = await db.execute(
            select(Invoice)
            .options(selectinload(Invoice.report).selectinload(Report.labtest).selectinload(LabTest.receipt))
            .where(Invoice.invoice_no == query)
        )
        invoice = result.scalar_one_or_none()
        
        # Try by invoice ID
        if not invoice:
            result = await db.execute(
                select(Invoice)
                .options(selectinload(Invoice.report).selectinload(Report.labtest).selectinload(LabTest.receipt))
                .where(Invoice.id == query)
            )
            invoice = result.scalar_one_or_none()
        
        if invoice:
            report = invoice.report
            labtest = report.labtest if report else None
            receipt = labtest.receipt if labtest else None
    
    if not receipt:
        return tracking_result
    
    # Found something! Build the timeline
    tracking_result.found = True
    tracking_result.id = receipt.id
    
    # Get related records if not already loaded
    if not labtest:
        result = await db.execute(
            select(LabTest).where(LabTest.receipt_id == receipt.id)
        )
        labtest = result.scalar_one_or_none()
    
    if not report and labtest:
        result = await db.execute(
            select(Report).where(Report.labtest_id == labtest.id)
        )
        report = result.scalar_one_or_none()
    
    if not invoice and report:
        result = await db.execute(
            select(Invoice).where(Invoice.report_id == report.id)
        )
        invoice = result.scalar_one_or_none()
    
    # Build timeline
    timeline = []
    current_step = "received"
    
    # Received
    timeline.append(TimelineStep(
        step="received",
        status="completed",
        timestamp=receipt.created_at,
        description=f"Received at {receipt.branch}"
    ))
    
    # Forwarded (if forward_to_central is True)
    if receipt.forward_to_central:
        timeline.append(TimelineStep(
            step="forwarded",
            status="completed",
            timestamp=receipt.created_at,
            description="Forwarded to Central Lab"
        ))
        current_step = "forwarded"
    
    # Lab stages
    if labtest:
        timeline.append(TimelineStep(
            step="lab_queued",
            status="completed",
            timestamp=labtest.created_at,
            description="Lab Processing Started"
        ))
        current_step = "lab_queued"
        
        if labtest.test_status.value in ["IN_PROGRESS", "COMPLETED"]:
            timeline.append(TimelineStep(
                step="in_progress",
                status="completed",
                timestamp=labtest.updated_at,
                description="Lab Testing In Progress"
            ))
            current_step = "in_progress"
        
        if labtest.test_status.value == "COMPLETED":
            timeline.append(TimelineStep(
                step="completed",
                status="completed",
                timestamp=labtest.updated_at,
                description="Lab Testing Completed"
            ))
            current_step = "completed"
    
    # Report stages
    if report:
        timeline.append(TimelineStep(
            step="report_ready",
            status="completed",
            timestamp=report.created_at,
            description="Report Generated"
        ))
        current_step = "report_ready"
        
        if report.final_status == FinalStatus.APPROVED:
            timeline.append(TimelineStep(
                step="approved",
                status="completed",
                timestamp=report.updated_at,
                description=f"Report Approved by {report.approved_by}"
            ))
            current_step = "approved"
            
            if report.comm_status.value in ["DISPATCHED", "DELIVERED"]:
                timeline.append(TimelineStep(
                    step="communicated",
                    status="completed",
                    timestamp=report.updated_at,
                    description=f"Report sent via {report.comm_channel.value}"
                ))
                current_step = "communicated"
    
    # Invoice stages
    if invoice:
        timeline.append(TimelineStep(
            step="invoiced",
            status="completed",
            timestamp=invoice.created_at,
            description=f"Invoice {invoice.invoice_no} created"
        ))
        current_step = "invoiced"
        
        if invoice.status == InvoiceStatus.PAID:
            timeline.append(TimelineStep(
                step="paid",
                status="completed",
                timestamp=invoice.paid_at or invoice.updated_at,
                description="Payment Received"
            ))
            current_step = "paid"
    
    # Add remaining steps as pending
    current_index = TIMELINE_STEPS.index(current_step) if current_step in TIMELINE_STEPS else 0
    for step in TIMELINE_STEPS[current_index + 1:]:
        timeline.append(TimelineStep(
            step=step,
            status="pending",
            description=get_step_description(step)
        ))
    
    tracking_result.current_step = current_step
    tracking_result.timeline = timeline
    tracking_result.type = "receipt"
    
    # Add available documents
    documents = []
    if report and report.final_status == FinalStatus.APPROVED:
        documents.append({
            "type": "report",
            "id": str(report.id),
            "name": f"Lab Report - {labtest.lab_doc_no if labtest else 'N/A'}",
            "status": "approved",
            "download_available": True
        })
    
    if invoice and invoice.status in [InvoiceStatus.ISSUED, InvoiceStatus.SENT, InvoiceStatus.PAID]:
        documents.append({
            "type": "invoice", 
            "id": str(invoice.id),
            "name": f"Invoice {invoice.invoice_no}",
            "status": invoice.status.value.lower(),
            "download_available": True
        })
    
    tracking_result.documents = documents
    
    return tracking_result


def get_step_description(step: str) -> str:
    descriptions = {
        "received": "Received at Branch",
        "forwarded": "Forwarded to Central Lab",
        "central": "Received at Central",
        "lab_queued": "Lab Processing Queued",
        "in_progress": "Lab Testing In Progress", 
        "completed": "Lab Testing Completed",
        "report_ready": "Report Generated",
        "approved": "Report Approved",
        "communicated": "Report Communicated",
        "invoiced": "Invoice Generated",
        "paid": "Payment Completed"
    }
    return descriptions.get(step, step.replace("_", " ").title())


@router.get("/status/{receipt_id}")
async def get_status(
    receipt_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get full status object for a receipt"""
    result = await db.execute(
        select(Receipt)
        .options(
            selectinload(Receipt.labtests)
            .selectinload(LabTest.reports)
            .selectinload(Report.invoices)
        )
        .where(Receipt.id == receipt_id)
    )
    receipt = result.scalar_one_or_none()
    
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    
    return {
        "receipt": {
            "id": str(receipt.id),
            "receiver_name": receipt.receiver_name,
            "contact_number": receipt.contact_number,
            "branch": receipt.branch,
            "company": receipt.company,
            "count_boxes": receipt.count_boxes,
            "receiving_mode": receipt.receiving_mode.value,
            "forward_to_central": receipt.forward_to_central,
            "courier_awb": receipt.courier_awb,
            "receipt_date": receipt.receipt_date.isoformat() if receipt.receipt_date else None,
            "created_at": receipt.created_at.isoformat(),
            "updated_at": receipt.updated_at.isoformat()
        },
        "labtests": [
            {
                "id": str(lt.id),
                "lab_doc_no": lt.lab_doc_no,
                "lab_person": lt.lab_person,
                "test_status": lt.test_status.value,
                "lab_report_status": lt.lab_report_status.value,
                "remarks": lt.remarks,
                "created_at": lt.created_at.isoformat(),
                "updated_at": lt.updated_at.isoformat(),
                "reports": [
                    {
                        "id": str(r.id),
                        "retesting_requested": r.retesting_requested,
                        "final_status": r.final_status.value,
                        "approved_by": r.approved_by,
                        "comm_status": r.comm_status.value,
                        "comm_channel": r.comm_channel.value,
                        "communicated_to_accounts": r.communicated_to_accounts,
                        "created_at": r.created_at.isoformat(),
                        "updated_at": r.updated_at.isoformat(),
                        "invoices": [
                            {
                                "id": str(inv.id),
                                "invoice_no": inv.invoice_no,
                                "status": inv.status.value,
                                "amount": float(inv.amount),
                                "issued_at": inv.issued_at.isoformat(),
                                "paid_at": inv.paid_at.isoformat() if inv.paid_at else None,
                                "created_at": inv.created_at.isoformat(),
                                "updated_at": inv.updated_at.isoformat()
                            } for inv in r.invoices
                        ]
                    } for r in lt.reports
                ]
            } for lt in receipt.labtests
        ]
    }


@router.get("/reports/{report_id}/download")
async def download_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_owner_user)
):
    """Download approved report"""
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.labtest))
        .where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.final_status != FinalStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Report not approved for download")
    
    # Create a simple PDF content for demo
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    import io
    
    # Create PDF in memory
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Add content to PDF
    p.drawString(100, 750, f"Lab Report - {report.labtest.lab_doc_no if report.labtest else 'N/A'}")
    p.drawString(100, 720, f"Report ID: {report_id}")
    p.drawString(100, 690, f"Status: {report.final_status.value if report.final_status else 'N/A'}")
    p.drawString(100, 660, f"Created: {report.created_at}")
    p.drawString(100, 630, f"Approved by: {report.approved_by or 'N/A'}")
    p.drawString(100, 600, f"Communication Status: {report.comm_status.value if report.comm_status else 'N/A'}")
    p.drawString(100, 570, f"Communication Channel: {report.comm_channel.value if report.comm_channel else 'N/A'}")
    p.drawString(100, 540, f"Retesting Requested: {'Yes' if report.retesting_requested else 'No'}")
    
    # Add LabTest details if available
    if report.labtest:
        p.drawString(100, 500, f"Lab Document No: {report.labtest.lab_doc_no}")
        p.drawString(100, 470, f"Lab Person: {report.labtest.lab_person}")
        p.drawString(100, 440, f"Test Status: {report.labtest.test_status.value if report.labtest.test_status else 'N/A'}")
        p.drawString(100, 410, f"Lab Report Status: {report.labtest.lab_report_status.value if report.labtest.lab_report_status else 'N/A'}")
        p.drawString(100, 380, f"Remarks: {report.labtest.remarks or 'No remarks'}")
        p.drawString(100, 350, f"Test Created: {report.labtest.created_at}")
        p.drawString(100, 320, f"Test Updated: {report.labtest.updated_at}")
    
    p.showPage()
    p.save()
    
    # Get PDF bytes
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    # Return as downloadable file
    from fastapi.responses import Response
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=report_{report.labtest.lab_doc_no if report.labtest else report_id}.pdf"
        }
    )


@router.get("/invoices/{invoice_id}/download")
async def download_invoice(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_owner_user)
):
    """Download invoice if status allows"""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.report))
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    if invoice.status not in [InvoiceStatus.ISSUED, InvoiceStatus.SENT, InvoiceStatus.PAID]:
        raise HTTPException(status_code=403, detail="Invoice not available for download")
    
    # Create a simple PDF content for demo
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    import io
    
    # Create PDF in memory
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    
    # Add content to PDF
    p.drawString(100, 750, f"INVOICE - {invoice.invoice_no}")
    p.drawString(100, 720, f"Invoice ID: {invoice_id}")
    p.drawString(100, 690, f"Amount: ${invoice.amount}")
    p.drawString(100, 660, f"Status: {invoice.status.value}")
    p.drawString(100, 630, f"Issued: {invoice.issued_at}")
    p.drawString(100, 600, f"Created: {invoice.created_at}")
    if invoice.paid_at:
        p.drawString(100, 570, f"Paid: {invoice.paid_at}")
    
    # Add report information if available
    if invoice.report:
        p.drawString(100, 540, f"Related Report ID: {invoice.report.id}")
    
    p.drawString(100, 510, "Services: Laboratory Testing and Analysis")
    
    p.showPage()
    p.save()
    
    # Get PDF bytes
    buffer.seek(0)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    
    # Return as downloadable file
    from fastapi.responses import Response
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{invoice.invoice_no}.pdf"
        }
    )


@router.post("/retest-requests", response_model=RetestRequestRead)
async def create_retest_request(
    request: RetestRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_owner_user)
):
    """Create a retest request for a report"""
    # Verify report exists
    result = await db.execute(
        select(Report).where(Report.id == request.report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Create retest request
    retest_request = RetestRequest(
        report_id=request.report_id,
        owner_email=request.owner_email,
        owner_phone=request.owner_phone,
        remarks=request.remarks
    )
    
    db.add(retest_request)
    await db.commit()
    await db.refresh(retest_request)
    
    return RetestRequestRead.model_validate(retest_request)


@router.post("/notify-preferences", response_model=OwnerPreferenceRead)
async def update_notification_preferences(
    preferences: OwnerPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_owner_user)
):
    """Update owner notification preferences"""
    # Check if preferences exist
    result = await db.execute(
        select(OwnerPreference).where(OwnerPreference.owner_email == preferences.owner_email)
    )
    existing_pref = result.scalar_one_or_none()
    
    if existing_pref:
        # Update existing preferences
        existing_pref.owner_phone = preferences.owner_phone
        existing_pref.email_notifications = preferences.email_notifications
        existing_pref.whatsapp_notifications = preferences.whatsapp_notifications
        existing_pref.sms_notifications = preferences.sms_notifications
        existing_pref.updated_at = datetime.utcnow()
        owner_pref = existing_pref
    else:
        # Create new preferences
        owner_pref = OwnerPreference(
            owner_email=preferences.owner_email,
            owner_phone=preferences.owner_phone,
            email_notifications=preferences.email_notifications,
            whatsapp_notifications=preferences.whatsapp_notifications,
            sms_notifications=preferences.sms_notifications
        )
        db.add(owner_pref)
    
    await db.commit()
    await db.refresh(owner_pref)
    
    return OwnerPreferenceRead.model_validate(owner_pref)


@router.get("/documents", response_model=OwnerDocumentList)
async def get_owner_documents(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_owner_user)
):
    """Get all documents available for the logged-in owner"""
    owner_email = current_user.get("email")
    
    if not owner_email:
        raise HTTPException(status_code=401, detail="Owner email not found in token")
    
    # For now, return all approved reports and issued invoices
    # In production, you'd filter by owner email/phone from receipts
    
    # Get approved reports
    reports_result = await db.execute(
        select(Report)
        .options(selectinload(Report.labtest))
        .where(Report.final_status == FinalStatus.APPROVED)
    )
    reports = reports_result.scalars().all()
    
    # Get issued invoices
    invoices_result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.report))
        .where(Invoice.status.in_([InvoiceStatus.ISSUED, InvoiceStatus.SENT, InvoiceStatus.PAID]))
    )
    invoices = invoices_result.scalars().all()
    
    return OwnerDocumentList(
        reports=[
            {
                "id": str(report.id),
                "name": f"Lab Report - {report.labtest.lab_doc_no if report.labtest else 'N/A'}",
                "status": "approved",
                "created_at": report.created_at.isoformat(),
                "approved_by": report.approved_by
            } for report in reports
        ],
        invoices=[
            {
                "id": str(invoice.id),
                "name": f"Invoice {invoice.invoice_no}",
                "status": invoice.status.value.lower(),
                "amount": float(invoice.amount),
                "created_at": invoice.created_at.isoformat(),
                "paid_at": invoice.paid_at.isoformat() if invoice.paid_at else None
            } for invoice in invoices
        ]
    )