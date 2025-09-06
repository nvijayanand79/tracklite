"""
Lab Test database models
"""
from sqlalchemy import Column, String, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
import enum
from .base import BaseModel
from ..utils.uuid_utils import StringUUID

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

class LabTest(BaseModel):
    __tablename__ = "labtests"
    
    receipt_id = Column(StringUUID, ForeignKey("receipts.id"), nullable=False, index=True)
    lab_doc_no = Column(String(100), nullable=False, index=True)
    lab_person = Column(String(255), nullable=False)
    test_status = Column(Enum(TestStatus), nullable=False, default=TestStatus.QUEUED, index=True)
    lab_report_status = Column(Enum(LabReportStatus), nullable=False, default=LabReportStatus.NOT_STARTED, index=True)
    remarks = Column(Text, nullable=True)
    
    # Relationship to Receipt
    receipt = relationship("Receipt", back_populates="lab_tests")
    
    # Relationship to LabTransfer
    transfers = relationship("LabTransfer", back_populates="labtest", cascade="all, delete-orphan")
    
    # Relationship to Report
    reports = relationship("Report", back_populates="labtest", cascade="all, delete-orphan")

    def to_dict(self):
        """Convert model to dictionary for API responses"""
        base_dict = super().to_dict()
        base_dict.update({
            "receipt_id": str(self.receipt_id),
            "test_status": self.test_status.value,
            "lab_report_status": self.lab_report_status.value,
        })
        return base_dict


class LabTransfer(BaseModel):
    __tablename__ = "lab_transfers"
    
    labtest_id = Column(StringUUID, ForeignKey("labtests.id"), nullable=False, index=True)
    from_user = Column(String(255), nullable=False)
    to_user = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    
    # Relationship to LabTest
    labtest = relationship("LabTest", back_populates="transfers")
    
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        base_dict = super().to_dict()
        base_dict.update({
            "labtest_id": str(self.labtest_id),
            "transfer_date": base_dict.get("created_at")  # Map created_at to transfer_date for compatibility
        })
        return base_dict
