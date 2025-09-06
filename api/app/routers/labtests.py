"""
Lab Tests router for CRUD operations and transfers
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
import uuid

from ..db import get_db
from ..models.labtest import LabTest, LabTransfer, TestStatus, LabReportStatus
from ..models.receipt import Receipt
from ..schemas.labtest import (
    CreateLabTest, UpdateLabTest, LabTestRead, CreateLabTransfer, 
    LabTransferRead, LabTestWithTransfers, LabTestListResponse
)
from .auth import get_admin_user

router = APIRouter(prefix="/labtests", tags=["lab-tests"])

@router.post("/", response_model=LabTestRead)
async def create_lab_test(
    lab_test: CreateLabTest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Create a new lab test linked to a receipt.
    
    Validates that the receipt exists and lab_doc_no is unique per branch.
    """
    try:
        # Verify receipt exists
        receipt_result = await db.execute(
            select(Receipt).where(Receipt.id == lab_test.receipt_id)
        )
        receipt = receipt_result.scalar_one_or_none()
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")

        # Check if lab_doc_no is unique per branch
        existing_labtest = await db.execute(
            select(LabTest).join(Receipt).where(
                and_(
                    LabTest.lab_doc_no == lab_test.lab_doc_no,
                    Receipt.branch == receipt.branch
                )
            )
        )
        
        if existing_labtest.scalar_one_or_none():
            raise HTTPException(
                status_code=400, 
                detail=f"Lab document number '{lab_test.lab_doc_no}' already exists in branch '{receipt.branch}'"
            )

        # Create lab test
        db_labtest = LabTest(
            id=str(uuid.uuid4()),
            receipt_id=lab_test.receipt_id,
            lab_doc_no=lab_test.lab_doc_no,
            lab_person=lab_test.lab_person,
            test_status=lab_test.test_status,
            lab_report_status=lab_test.lab_report_status,
            remarks=lab_test.remarks
        )
        
        db.add(db_labtest)
        await db.commit()
        await db.refresh(db_labtest)
        
        return LabTestRead(**db_labtest.to_dict())
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/", response_model=List[LabTestRead])
async def get_lab_tests(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user),
    status: Optional[TestStatus] = Query(None, description="Filter by test status"),
    receipt_id: Optional[str] = Query(None, description="Filter by receipt ID")
):
    """
    Get all lab tests with optional filtering by status or receipt_id.
    """
    try:
        # Build query with filters
        query = select(LabTest).order_by(LabTest.created_at.desc())
        
        if status:
            query = query.where(LabTest.test_status == status)
        
        if receipt_id:
            query = query.where(LabTest.receipt_id == receipt_id)
        
        # Execute query
        result = await db.execute(query)
        lab_tests = result.scalars().all()
        
        return [LabTestRead(**lab_test.to_dict()) for lab_test in lab_tests]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{labtest_id}", response_model=LabTestWithTransfers)
async def get_lab_test(
    labtest_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Get a specific lab test with its transfer history.
    """
    try:
        # Get lab test with transfers
        result = await db.execute(
            select(LabTest)
            .options(selectinload(LabTest.transfers))
            .where(LabTest.id == labtest_id)
        )
        lab_test = result.scalar_one_or_none()
        
        if not lab_test:
            raise HTTPException(status_code=404, detail="Lab test not found")
        
        # Convert to response format
        lab_test_dict = lab_test.to_dict()
        transfers = [LabTransferRead(**transfer.to_dict()) for transfer in lab_test.transfers]
        
        return LabTestWithTransfers(**lab_test_dict, transfers=transfers)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lab test ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.patch("/{labtest_id}", response_model=LabTestRead)
async def update_lab_test(
    labtest_id: str,
    updates: UpdateLabTest,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Update lab test status, lab report status, or remarks.
    """
    try:
        # Get lab test
        result = await db.execute(
            select(LabTest).where(LabTest.id == labtest_id)
        )
        lab_test = result.scalar_one_or_none()
        
        if not lab_test:
            raise HTTPException(status_code=404, detail="Lab test not found")
        
        # Update fields
        if updates.test_status is not None:
            lab_test.test_status = updates.test_status
        
        if updates.lab_report_status is not None:
            lab_test.lab_report_status = updates.lab_report_status
        
        if updates.remarks is not None:
            lab_test.remarks = updates.remarks
        
        await db.commit()
        await db.refresh(lab_test)
        
        return LabTestRead(**lab_test.to_dict())
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lab test ID format")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{labtest_id}/transfer", response_model=LabTransferRead)
async def transfer_lab_test(
    labtest_id: str,
    transfer_data: CreateLabTransfer,
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Transfer lab test from one user to another with logging.
    """
    try:
        # Verify lab test exists
        result = await db.execute(
            select(LabTest).where(LabTest.id == labtest_id)
        )
        lab_test = result.scalar_one_or_none()
        
        if not lab_test:
            raise HTTPException(status_code=404, detail="Lab test not found")
        
        # Create transfer record
        db_transfer = LabTransfer(
            id=str(uuid.uuid4()),
            labtest_id=labtest_id,
            from_user=transfer_data.from_user,
            to_user=transfer_data.to_user,
            reason=transfer_data.reason
        )
        
        # Update lab test person to the new user
        lab_test.lab_person = transfer_data.to_user
        
        db.add(db_transfer)
        await db.commit()
        await db.refresh(db_transfer)
        
        return LabTransferRead(**db_transfer.to_dict())
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid lab test ID format")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
