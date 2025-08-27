from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid
from enum import Enum


class InvoiceStatus(str, Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    SENT = "SENT"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class InvoiceBase(BaseModel):
    report_id: uuid.UUID
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Amount must be positive")
    status: InvoiceStatus = InvoiceStatus.DRAFT


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    
    @validator('amount')
    def validate_amount(cls, v):
        if v is not None and v <= 0:
            raise ValueError('Amount must be positive')
        return v


class InvoiceRead(InvoiceBase):
    id: uuid.UUID
    invoice_no: str
    issued_at: datetime
    paid_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceInDB(InvoiceRead):
    pass
