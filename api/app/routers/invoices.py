from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import uuid

from ..db import get_db
from ..models.invoice import Invoice
from ..models.report import Report, FinalStatus
from ..schemas.invoice import InvoiceCreate, InvoiceUpdate, InvoiceRead, InvoiceStatus
from .auth import get_current_user

router = APIRouter(prefix="/invoices", tags=["invoices"])


async def generate_invoice_number(db: AsyncSession) -> str:
    """Generate unique invoice number in format INV-{year}-{sequence}"""
    year = datetime.now().year
    
    # Get the latest invoice for this year
    result = await db.execute(
        select(Invoice)
        .where(Invoice.invoice_no.like(f"INV-{year}-%"))
        .order_by(Invoice.invoice_no.desc())
        .limit(1)
    )
    latest_invoice = result.scalar_one_or_none()
    
    if latest_invoice:
        # Extract sequence number and increment
        parts = latest_invoice.invoice_no.split('-')
        if len(parts) == 3:
            try:
                sequence = int(parts[2]) + 1
            except ValueError:
                sequence = 1
        else:
            sequence = 1
    else:
        sequence = 1
    
    return f"INV-{year}-{sequence:04d}"


@router.post("/", response_model=InvoiceRead)
async def create_invoice(
    invoice: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new invoice for an approved report"""
    
    # Verify that the report exists and is approved
    result = await db.execute(
        select(Report).where(Report.id == invoice.report_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.final_status != FinalStatus.APPROVED:
        raise HTTPException(
            status_code=400, 
            detail="Cannot create invoice for report that is not approved"
        )
    
    # Check if invoice already exists for this report
    existing_result = await db.execute(
        select(Invoice).where(Invoice.report_id == invoice.report_id)
    )
    existing_invoice = existing_result.scalar_one_or_none()
    if existing_invoice:
        raise HTTPException(
            status_code=400,
            detail="Invoice already exists for this report"
        )
    
    # Generate unique invoice number
    invoice_no = await generate_invoice_number(db)
    
    # Create the invoice
    db_invoice = Invoice(
        **invoice.model_dump(),
        invoice_no=invoice_no
    )
    db.add(db_invoice)
    await db.commit()
    await db.refresh(db_invoice)
    
    return InvoiceRead.model_validate(db_invoice)


@router.get("/", response_model=List[InvoiceRead])
async def list_invoices(
    status: Optional[InvoiceStatus] = Query(None, description="Filter by status"),
    report_id: Optional[uuid.UUID] = Query(None, description="Filter by report ID"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all invoices with optional filtering"""
    
    query = select(Invoice).options(selectinload(Invoice.report))
    
    # Apply filters
    if status:
        query = query.where(Invoice.status == status)
    if report_id:
        query = query.where(Invoice.report_id == report_id)
    
    # Order by creation date (newest first)
    query = query.order_by(Invoice.created_at.desc())
    
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return [InvoiceRead.model_validate(invoice) for invoice in invoices]


@router.get("/approved-reports", response_model=List[dict])
async def get_approved_reports(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all approved reports that don't have invoices yet"""
    
    # Get reports that are approved but don't have invoices
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.labtest))
        .where(Report.final_status == FinalStatus.APPROVED)
        .where(~Report.invoices.any())  # Reports without invoices
        .order_by(Report.created_at.desc())
    )
    reports = result.scalars().all()
    
    # Return simplified report info for dropdown
    return [
        {
            "id": str(report.id),
            "labtest_id": str(report.labtest_id),
            "lab_doc_no": report.labtest.lab_doc_no if report.labtest else None,
            "created_at": report.created_at.isoformat()
        }
        for report in reports
    ]


@router.get("/{invoice_id}", response_model=InvoiceRead)
async def get_invoice(
    invoice_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific invoice by ID"""
    
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.report))
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return InvoiceRead.model_validate(invoice)


@router.patch("/{invoice_id}", response_model=InvoiceRead)
async def update_invoice(
    invoice_id: uuid.UUID,
    invoice_update: InvoiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update invoice status and details"""
    
    # Get the invoice
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Update fields that are provided
    update_data = invoice_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "status" and value == InvoiceStatus.PAID:
            # Auto-set paid_at when status is changed to PAID
            invoice.paid_at = datetime.now()
        elif field == "status" and value != InvoiceStatus.PAID:
            # Clear paid_at if status is changed away from PAID
            invoice.paid_at = None
        
        setattr(invoice, field, value)
    
    await db.commit()
    await db.refresh(invoice)
    
    return InvoiceRead.model_validate(invoice)
