from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import datetime
import uuid

from ..db import get_db
from ..models.receipt import Receipt

router = APIRouter(tags=["owner"])

STEPS = [
    ("received", "Received at Branch"),
    ("forwarded", "Forwarded to Chennai"),
    ("central", "Received at Central"),
    ("queued", "Lab Queued"),
    ("in_progress", "In Progress"),
    ("completed", "Completed"),
    ("report_ready", "Report Ready"),
    ("communicated", "Communicated"),
    ("invoiced", "Invoiced"),
    ("paid", "Paid"),
]

@router.get("/track")
async def track(
    awb: Optional[str] = Query(default=None),
    receipt: Optional[str] = Query(default=None),
    report: Optional[str] = Query(default=None),
    invoice: Optional[str] = Query(default=None),
    db: AsyncSession = Depends(get_db)
):
    if not any([awb, receipt, report, invoice]):
        raise HTTPException(status_code=400, detail="Provide one of awb, receipt, report, invoice")

    # Query the receipts table
    found_receipt = None
    
    if awb or receipt:
        # Build query to search by AWB or receipt ID
        query_conditions = []
        
        if awb:
            query_conditions.append(Receipt.courier_awb == awb)
        
        if receipt:
            # Try to match receipt ID (UUID) - convert string to UUID first
            try:
                receipt_uuid = uuid.UUID(receipt)
                query_conditions.append(Receipt.id == receipt_uuid)
            except ValueError:
                # If invalid UUID format, this will not match anything
                # which is fine - we'll return 404
                pass
        
        # Execute query with OR condition
        if query_conditions:
            result = await db.execute(
                select(Receipt).where(or_(*query_conditions))
            )
            found_receipt = result.scalar_one_or_none()
    
    if not found_receipt:
        raise HTTPException(
            status_code=404, 
            detail=f"No receipt found for the provided {'AWB' if awb else 'receipt ID'}"
        )
    
    # Build timeline based on receipt data
    current_step_index = 0  # Default to "received"
    
    # Step 0: Always mark "received" as done (receipt exists in DB)
    # Determine current step based on receipt status
    if found_receipt.forward_to_central:
        # If forwarded to central, progression: received → forwarded → central → queued
        current_step_index = 3  # "queued" - lab queued (placeholder for central processing)
    else:
        # If not forwarded (local branch), progression: received → queued (skip forwarded/central)
        current_step_index = 3  # "queued" - lab queued (placeholder for local processing)
    
    # Build timeline with timestamps
    timeline = []
    for i, (key, label) in enumerate(STEPS):
        is_current = i == current_step_index
        is_done = False
        
        # Determine if this step is done based on receipt data
        if key == "received":
            is_done = True  # Always done since receipt exists
        elif key == "forwarded":
            is_done = found_receipt.forward_to_central  # Done if forwarded to central
        elif key == "central":
            is_done = found_receipt.forward_to_central  # Done if forwarded to central
        elif i < current_step_index:
            is_done = True  # All steps before current are done
        
        # Adjust current status
        if is_done and i == current_step_index:
            is_current = False  # Can't be both done and current
        elif i < current_step_index:
            is_done = True
            is_current = False
        
        # Add timestamps for completed steps
        timestamp = None
        if is_done or is_current:
            if key == "received":
                timestamp = found_receipt.created_at.isoformat()
            elif key == "forwarded" and found_receipt.forward_to_central:
                # Use created_at as forwarded timestamp (placeholder logic)
                timestamp = found_receipt.created_at.isoformat()
            elif key == "central" and found_receipt.forward_to_central:
                timestamp = found_receipt.created_at.isoformat()
            elif key == "queued" and is_current:
                # Current step gets current time as placeholder
                timestamp = datetime.now().isoformat()
        
        timeline.append({
            "key": key,
            "label": label,
            "current": is_current,
            "done": is_done,
            "timestamp": timestamp,
        })
    
    return {
        "query": {"awb": awb, "receipt": receipt, "report": report, "invoice": invoice},
        "currentStep": STEPS[current_step_index][0],
        "receipt_info": {
            "id": str(found_receipt.id),
            "receiver_name": found_receipt.receiver_name,
            "branch": found_receipt.branch,
            "company": found_receipt.company,
            "receiving_mode": found_receipt.receiving_mode.value,
            "forward_to_central": found_receipt.forward_to_central,
            "courier_awb": found_receipt.courier_awb,
            "created_at": found_receipt.created_at.isoformat(),
        },
        "timeline": timeline,
    }