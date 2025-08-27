from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime
import uuid
from enum import Enum


class FinalStatus(str, Enum):
    DRAFT = "DRAFT"
    READY_FOR_APPROVAL = "READY_FOR_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CommunicationStatus(str, Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"


class CommunicationChannel(str, Enum):
    COURIER = "COURIER"
    IN_PERSON = "IN_PERSON"
    EMAIL = "EMAIL"


class ReportBase(BaseModel):
    labtest_id: uuid.UUID
    retesting_requested: bool = False
    final_status: FinalStatus = FinalStatus.DRAFT
    approved_by: Optional[str] = None
    comm_status: CommunicationStatus = CommunicationStatus.PENDING
    comm_channel: CommunicationChannel = CommunicationChannel.EMAIL
    communicated_to_accounts: bool = False

    @validator('approved_by')
    def validate_approved_by(cls, v, values):
        # If final_status is APPROVED, approved_by must be provided
        final_status = values.get('final_status')
        if final_status == FinalStatus.APPROVED and not v:
            raise ValueError('approved_by is required when final_status is APPROVED')
        return v


class ReportCreate(ReportBase):
    pass


class ReportUpdate(BaseModel):
    retesting_requested: Optional[bool] = None
    final_status: Optional[FinalStatus] = None
    approved_by: Optional[str] = None
    comm_status: Optional[CommunicationStatus] = None
    comm_channel: Optional[CommunicationChannel] = None
    communicated_to_accounts: Optional[bool] = None

    @validator('approved_by')
    def validate_approved_by(cls, v, values):
        # If final_status is APPROVED, approved_by must be provided
        final_status = values.get('final_status')
        if final_status == FinalStatus.APPROVED and not v:
            raise ValueError('approved_by is required when final_status is APPROVED')
        return v


class ReportApprove(BaseModel):
    approved_by: str


class ReportRead(ReportBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportInDB(ReportRead):
    pass
