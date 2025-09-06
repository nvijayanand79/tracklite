from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
import uuid

from ..db import get_db
from ..models.receipt import Receipt, ReceivingModeEnum
from ..schemas.receipt import CreateReceipt, ReceiptRead, ReceiptListResponse, UpdateReceipt
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

@router.delete("/receipts/{receipt_id}")
async def delete_receipt(receipt_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a specific receipt by ID.
    """
    try:
        # Delete receipt by ID (now stored as string)
        result = await db.execute(
            delete(Receipt).where(Receipt.id == receipt_id)
        )
        
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Receipt not found")
        
        await db.commit()
        
        return {"message": "Receipt deleted successfully", "id": receipt_id}
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.options("/receipts/{receipt_id}")
async def receipts_options(receipt_id: str):
    """Handle preflight OPTIONS request for receipt operations"""
    return {"message": "OK"}


@router.patch("/receipts/{receipt_id}", response_model=ReceiptRead)
async def update_receipt(receipt_id: str, payload: UpdateReceipt, db: AsyncSession = Depends(get_db), current_user: Dict[str, Any] = Depends(get_admin_user)):
    """Update a receipt partially"""
    try:
        result = await db.execute(select(Receipt).where(Receipt.id == receipt_id))
        receipt = result.scalar_one_or_none()
        if not receipt:
            raise HTTPException(status_code=404, detail="Receipt not found")

        data = payload.model_dump(exclude_none=True)
        for k, v in data.items():
            # Map frontend names to model fields
            if k == 'forward_to_chennai':
                setattr(receipt, 'forward_to_central', v)
            elif k == 'awb_no':
                setattr(receipt, 'courier_awb', v)
            elif k == 'date':
                setattr(receipt, 'receipt_date', v)
            elif k == 'count_of_boxes':
                setattr(receipt, 'count_boxes', v)
            elif k == 'receiving_mode':
                # Convert string to enum
                mode_enum = ReceivingModeEnum.COURIER if v == "COURIER" else ReceivingModeEnum.PERSON
                setattr(receipt, 'receiving_mode', mode_enum)
            else:
                setattr(receipt, k, v)

        await db.commit()
        await db.refresh(receipt)

        return ReceiptRead(**receipt.to_dict())
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Utility endpoint to get receipts statistics
@router.get("/receipts/stats/summary")
async def get_receipts_stats(db: AsyncSession = Depends(get_db)):
    """
    Get summary statistics about receipts.
    """
    try:
        # Get total count
        total_result = await db.execute(select(func.count(Receipt.id)))
        total_receipts = total_result.scalar()
        
        if total_receipts == 0:
            return {
                "total_receipts": 0,
                "by_receiving_mode": {},
                "by_branch": {},
                "with_awb": 0,
                "forwarded_to_chennai": 0
            }
        
        # Get all receipts for detailed statistics
        result = await db.execute(select(Receipt))
        receipts = result.scalars().all()
        
        # Calculate statistics
        by_receiving_mode = {}
        by_branch = {}
        with_awb = 0
        forwarded_to_chennai = 0
        
        for receipt in receipts:
            # Count by receiving mode
            mode = receipt.receiving_mode.value
            by_receiving_mode[mode] = by_receiving_mode.get(mode, 0) + 1
            
            # Count by branch
            branch = receipt.branch
            by_branch[branch] = by_branch.get(branch, 0) + 1
            
            # Count receipts with AWB
            if receipt.courier_awb:
                with_awb += 1
            
            # Count forwarded to Chennai
            if receipt.forward_to_central:
                forwarded_to_chennai += 1
        
        return {
            "total_receipts": total_receipts,
            "by_receiving_mode": by_receiving_mode,
            "by_branch": by_branch,
            "with_awb": with_awb,
            "forwarded_to_chennai": forwarded_to_chennai
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
