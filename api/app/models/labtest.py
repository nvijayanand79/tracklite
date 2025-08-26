"""
Lab Test database models
"""
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from ..db import Base

class TestStatus(str, enum.Enum):
    QUEUED = "QUEUED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    NEEDS_RETEST = "NEEDS_RETEST"
    ON_HOLD = "ON_HOLD"

class LabReportStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    DRAFT = "DRAFT"
    READY = "READY"
    SIGNED_OFF = "SIGNED_OFF"

class LabTest(Base):
    __tablename__ = "labtests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    receipt_id = Column(UUID(as_uuid=True), ForeignKey("receipts.id"), nullable=False, index=True)
    lab_doc_no = Column(String(100), nullable=False, index=True)
    lab_person = Column(String(255), nullable=False)
    test_status = Column(Enum(TestStatus), nullable=False, default=TestStatus.QUEUED, index=True)
    lab_report_status = Column(Enum(LabReportStatus), nullable=False, default=LabReportStatus.NOT_STARTED, index=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationship to Receipt
    receipt = relationship("Receipt", back_populates="lab_tests")
    
    # Relationship to LabTransfer
    transfers = relationship("LabTransfer", back_populates="labtest", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<LabTest(id={self.id}, lab_doc_no='{self.lab_doc_no}', status='{self.test_status}')>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            "id": str(self.id),
            "receipt_id": str(self.receipt_id),
            "lab_doc_no": self.lab_doc_no,
            "lab_person": self.lab_person,
            "test_status": self.test_status.value,
            "lab_report_status": self.lab_report_status.value,
            "remarks": self.remarks,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class LabTransfer(Base):
    __tablename__ = "lab_transfers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    labtest_id = Column(UUID(as_uuid=True), ForeignKey("labtests.id"), nullable=False, index=True)
    from_user = Column(String(255), nullable=False)
    to_user = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    transferred_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    
    # Relationship to LabTest
    labtest = relationship("LabTest", back_populates="transfers")
    
    def __repr__(self):
        return f"<LabTransfer(id={self.id}, from_user='{self.from_user}', to_user='{self.to_user}')>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            "id": str(self.id),
            "labtest_id": str(self.labtest_id),
            "from_user": self.from_user,
            "to_user": self.to_user,
            "reason": self.reason,
            "transferred_at": self.transferred_at.isoformat() if self.transferred_at else None
        }
