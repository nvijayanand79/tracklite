from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from ..db import get_db
from ..models.receipt import Receipt, ReceivingModeEnum
from ..schemas.receipt import CreateReceipt, ReceiptRead, ReceiptListResponse
from .auth import get_admin_user

router = APIRouter()

@router.post("/receipts", response_model=ReceiptRead)
async def create_receipt(
    receipt: CreateReceipt, 
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user)
):
    """
    Create a new receipt with validation.
    
    Validates that AWB number is provided when:
    - Receiving mode is "COURIER", OR
    - Branch is not "Chennai" AND forward to Chennai is enabled
    """
    try:
        # Convert receiving mode to enum
        receiving_mode_enum = ReceivingModeEnum.COURIER if receipt.receiving_mode == "COURIER" else ReceivingModeEnum.PERSON
        
        # Create receipt model instance
        db_receipt = Receipt(
            id=uuid.uuid4(),
            receiver_name=receipt.receiver_name,
            contact_number=receipt.contact_number,
            receipt_date=receipt.date,
            branch=receipt.branch,
            company=receipt.company,
            count_boxes=receipt.count_of_boxes,
            receiving_mode=receiving_mode_enum,
            forward_to_central=receipt.forward_to_chennai,
            courier_awb=receipt.awb_no
        )
        
        # Add to database
        db.add(db_receipt)
        await db.commit()
        await db.refresh(db_receipt)
        
        # Return response using the model's to_dict method
        receipt_dict = db_receipt.to_dict()
        return ReceiptRead(**receipt_dict)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/receipts", response_model=List[ReceiptRead])
async def get_receipts(
    db: AsyncSession = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_admin_user),
    branch: Optional[str] = Query(None, description="Filter by branch"),
    receiver: Optional[str] = Query(None, description="Filter by receiver name")
):
    """
    Retrieve all receipts from database with optional filters.
    """
    try:
        # Build query with filters
        query = select(Receipt).order_by(Receipt.created_at.desc())
        
        if branch:
            query = query.where(Receipt.branch.ilike(f"%{branch}%"))
        
        if receiver:
            query = query.where(Receipt.receiver_name.ilike(f"%{receiver}%"))
        
        # Execute query
        result = await db.execute(query)
        receipts = result.scalars().all()
        
        # Convert to response format
        return [ReceiptRead(**receipt.to_dict()) for receipt in receipts]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/receipts/{receipt_id}", response_model=ReceiptRead)
async def get_receipt(receipt_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve a specific receipt by ID.
    """
    try:
        # Query receipt by ID (now stored as string)
        result = await db.execute(
            select(Receipt).where(Receipt.id == receipt_id)
        )
        receipt = result.scalar_one_or_none()
        
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        return ReceiptRead(**receipt.to_dict())
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
