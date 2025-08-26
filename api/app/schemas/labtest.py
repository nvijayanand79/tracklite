"""
Pydantic schemas for lab test validation and serialization
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

class TestStatus(str, Enum):
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    NEEDS_RETEST = "NEEDS_RETEST"
    ON_HOLD = "ON_HOLD"

class LabReportStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    DRAFT = "DRAFT"
    READY = "READY"
    SIGNED_OFF = "SIGNED_OFF"

class CreateLabTest(BaseModel):
    receipt_id: str = Field(..., description="UUID of the associated receipt")
    lab_doc_no: str = Field(..., min_length=1, max_length=100, description="Lab document number")
    lab_person: str = Field(..., min_length=1, max_length=255, description="Person responsible for the lab test")
    test_status: TestStatus = Field(default=TestStatus.QUEUED, description="Current test status")
    lab_report_status: LabReportStatus = Field(default=LabReportStatus.NOT_STARTED, description="Lab report status")
    remarks: Optional[str] = Field(None, description="Additional remarks")

    @field_validator('lab_doc_no')
    @classmethod
    def validate_lab_doc_no(cls, v):
        if not v or v.strip() == '':
            raise ValueError('Lab document number cannot be empty')
        return v.strip()

    @field_validator('receipt_id')
    @classmethod
    def validate_receipt_id(cls, v):
        try:
            uuid.UUID(v)
            return v
        except ValueError:
            raise ValueError('Receipt ID must be a valid UUID')

class UpdateLabTest(BaseModel):
    test_status: Optional[TestStatus] = Field(None, description="Updated test status")
    lab_report_status: Optional[LabReportStatus] = Field(None, description="Updated lab report status")
    remarks: Optional[str] = Field(None, description="Updated remarks")

class LabTestRead(BaseModel):
    id: str = Field(..., description="Lab test UUID")
    receipt_id: str = Field(..., description="Associated receipt UUID")
    lab_doc_no: str = Field(..., description="Lab document number")
    lab_person: str = Field(..., description="Person responsible for the lab test")
    test_status: str = Field(..., description="Current test status")
    lab_report_status: str = Field(..., description="Lab report status")
    remarks: Optional[str] = Field(None, description="Additional remarks")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True

class CreateLabTransfer(BaseModel):
    from_user: str = Field(..., min_length=1, max_length=255, description="User transferring the lab test")
    to_user: str = Field(..., min_length=1, max_length=255, description="User receiving the lab test")
    reason: str = Field(..., min_length=1, description="Reason for the transfer")

class LabTransferRead(BaseModel):
    id: str = Field(..., description="Transfer UUID")
    labtest_id: str = Field(..., description="Lab test UUID")
    from_user: str = Field(..., description="User who transferred")
    to_user: str = Field(..., description="User who received")
    reason: str = Field(..., description="Transfer reason")
    transferred_at: str = Field(..., description="Transfer timestamp")

    class Config:
        from_attributes = True

class LabTestWithTransfers(LabTestRead):
    transfers: List[LabTransferRead] = Field(default_factory=list, description="Transfer history")

class LabTestListResponse(BaseModel):
    lab_tests: List[LabTestRead]
    total: int
