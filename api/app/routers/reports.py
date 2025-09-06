from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid

from ..db import get_db
from ..models.report import Report, FinalStatus
from ..models.labtest import LabTest
from ..schemas.report import ReportCreate, ReportUpdate, ReportRead, ReportApprove
from .auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/", response_model=ReportRead)
async def create_report(
    report: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new report linked to a lab test"""
    
    # Verify that the lab test exists
    result = await db.execute(select(LabTest).where(LabTest.id == report.labtest_id))
    labtest = result.scalar_one_or_none()
    if not labtest:
        raise HTTPException(status_code=404, detail="Lab test not found")
    
    # Create the report
    db_report = Report(**report.model_dump())
    db.add(db_report)
    await db.commit()
    await db.refresh(db_report)
    
    return ReportRead.model_validate(db_report)


@router.get("/", response_model=List[ReportRead])
async def list_reports(
    final_status: Optional[FinalStatus] = Query(None, description="Filter by final status"),
    labtest_id: Optional[uuid.UUID] = Query(None, description="Filter by lab test ID"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all reports with optional filtering"""
    
    query = select(Report).options(selectinload(Report.labtest))
    
    # Apply filters
    if final_status:
        query = query.where(Report.final_status == final_status)
    if labtest_id:
        query = query.where(Report.labtest_id == labtest_id)
    
    # Order by creation date (newest first)
    query = query.order_by(Report.created_at.desc())
    
    result = await db.execute(query)
    reports = result.scalars().all()
    
    return [ReportRead.model_validate(report) for report in reports]


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific report by ID"""
    
    result = await db.execute(
        select(Report)
        .options(selectinload(Report.labtest))
        .where(Report.id == report_id)
    )
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return ReportRead.model_validate(report)


@router.options("/{report_id}")
async def report_options(report_id: str):
    """Handle preflight OPTIONS request for report operations"""
    return {"message": "OK"}

@router.patch("/{report_id}", response_model=ReportRead)
async def update_report(
    report_id: str,
    report_update: ReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update report statuses and details"""
    
    # Get the report
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update fields that are provided
    update_data = report_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    
    await db.commit()
    await db.refresh(report)
    
    return ReportRead.model_validate(report)


@router.post("/{report_id}/approve", response_model=ReportRead)
async def approve_report(
    report_id: str,
    approval: ReportApprove,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Approve a report by setting final_status to APPROVED and approved_by to current user"""
    
    # Get the report
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Set approval details
    report.final_status = FinalStatus.APPROVED
    report.approved_by = approval.approved_by
    
    await db.commit()
    await db.refresh(report)
    
    return ReportRead.model_validate(report)
