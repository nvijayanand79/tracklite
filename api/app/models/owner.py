import enum
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from .base import BaseModel
from ..utils.uuid_utils import StringUUID


class RetestRequestStatus(enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class RetestRequest(BaseModel):
    __tablename__ = "retest_requests"
    
    report_id = Column(StringUUID, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    owner_email = Column(String(255), nullable=False)
    owner_phone = Column(String(20), nullable=True)
    remarks = Column(Text, nullable=False)
    status = Column(Enum(RetestRequestStatus), default=RetestRequestStatus.PENDING, nullable=False)
    admin_response = Column(Text, nullable=True)
    
    # Relationships
    report = relationship("Report", back_populates="retest_requests")


class OwnerPreference(BaseModel):
    __tablename__ = "owner_preferences"
    
    owner_email = Column(String(255), unique=True, nullable=False)
    owner_phone = Column(String(20), nullable=True)
    email_notifications = Column(Boolean, default=True, nullable=False)
    whatsapp_notifications = Column(Boolean, default=False, nullable=False)
    sms_notifications = Column(Boolean, default=False, nullable=False)
