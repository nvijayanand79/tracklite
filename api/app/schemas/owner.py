from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class RetestRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class RetestRequestCreate(BaseModel):
    report_id: uuid.UUID
    owner_email: EmailStr
    owner_phone: Optional[str] = None
    remarks: str
    
    @validator('remarks')
    def validate_remarks(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('Remarks must be at least 10 characters long')
        return v.strip()


class RetestRequestRead(BaseModel):
    id: uuid.UUID
    report_id: uuid.UUID
    owner_email: str
    owner_phone: Optional[str]
    remarks: str
    status: RetestRequestStatus
    admin_response: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OwnerPreferenceUpdate(BaseModel):
    owner_email: EmailStr
    owner_phone: Optional[str] = None
    email_notifications: bool = True
    whatsapp_notifications: bool = False
    sms_notifications: bool = False


class OwnerPreferenceRead(BaseModel):
    id: uuid.UUID
    owner_email: str
    owner_phone: Optional[str]
    email_notifications: bool
    whatsapp_notifications: bool
    sms_notifications: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TrackingQuery(BaseModel):
    query: str
    
    @validator('query')
    def validate_query(cls, v):
        if len(v.strip()) < 3:
            raise ValueError('Query must be at least 3 characters long')
        return v.strip()


class TimelineStep(BaseModel):
    step: str
    status: str  # completed, current, pending
    timestamp: Optional[datetime] = None
    description: Optional[str] = None


class TrackingResult(BaseModel):
    found: bool
    type: Optional[str] = None  # receipt, labtest, report, invoice
    id: Optional[uuid.UUID] = None
    current_step: Optional[str] = None
    timeline: List[TimelineStep] = []
    documents: List[Dict[str, Any]] = []


class OwnerDocumentList(BaseModel):
    reports: List[Dict[str, Any]] = []
    invoices: List[Dict[str, Any]] = []


class DownloadRequest(BaseModel):
    document_type: str  # "report" or "invoice"
    document_id: uuid.UUID
