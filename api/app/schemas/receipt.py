"""
Pydantic schemas for receipt validation and serialization
"""
from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime
from enum import Enum
import uuid

class ReceivingMode(str, Enum):
    PERSON = "PERSON"
    COURIER = "COURIER"

class CreateReceipt(BaseModel):
    receiver_name: str = Field(..., min_length=1, max_length=255, description="Name of the receiver")
    contact_number: str = Field(..., min_length=10, max_length=15, description="Contact phone number")
    date: str = Field(..., description="Receipt date in YYYY-MM-DD format")
    branch: str = Field(..., min_length=1, max_length=100, description="Branch location")
    company: str = Field(..., min_length=1, max_length=255, description="Company name")
    count_of_boxes: int = Field(..., ge=1, description="Number of boxes")
    receiving_mode: ReceivingMode = Field(..., description="How the package is received")
    forward_to_chennai: bool = Field(default=False, description="Whether to forward to Chennai")
    awb_no: Optional[str] = Field(None, max_length=100, description="Courier AWB number")

    @field_validator('contact_number')
    @classmethod
    def validate_contact_number(cls, v):
        # Remove any non-digit characters for validation
        digits_only = ''.join(filter(str.isdigit, v))
        if len(digits_only) < 10:
            raise ValueError('Contact number must have at least 10 digits')
        return v

    @field_validator('date')
    @classmethod
    def validate_date(cls, v):
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            raise ValueError('Date must be in YYYY-MM-DD format')

    @model_validator(mode='after')
    def validate_awb_requirements(self):
        """Validate AWB requirements based on business rules"""
        receiving_mode = self.receiving_mode
        branch = self.branch
        forward_to_chennai = self.forward_to_chennai
        awb_no = self.awb_no

        # Rule 1: If receiving_mode = COURIER → courier_awb required
        if receiving_mode == ReceivingMode.COURIER and not awb_no:
            raise ValueError('AWB number is required when receiving mode is COURIER')

        # Rule 2: If branch != "Chennai" AND forward_to_central = true → courier_awb required
        if branch.lower() != "chennai" and forward_to_chennai and not awb_no:
            raise ValueError('AWB number is required when forwarding to Chennai from non-Chennai branch')

        return self

class ReceiptRead(BaseModel):
    id: str = Field(..., description="Unique receipt ID")
    receiver_name: str
    contact_number: str
    date: str
    branch: str
    company: str
    count_of_boxes: int
    receiving_mode: str
    forward_to_chennai: bool
    awb_no: Optional[str]
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True

class ReceiptListResponse(BaseModel):
    receipts: list[ReceiptRead]
    total: int
