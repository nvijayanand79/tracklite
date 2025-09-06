from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime

from ..db import Base


class ReceivingModeEnum(enum.Enum):
    PERSON = "PERSON"
    COURIER = "COURIER"


class Receipt(Base):
    __tablename__ = "receipts"

    # Primary key
    id = Column(
        String(36), 
        primary_key=True, 
        default=lambda: str(uuid.uuid4()),
        index=True
    )
    
    # Receipt details
    receiver_name = Column(String(255), nullable=False, index=True)
    contact_number = Column(String(50), nullable=False)
    branch = Column(String(100), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    count_boxes = Column(Integer, nullable=False)
    
    # Receiving mode with enum constraint
    receiving_mode = Column(
        Enum(ReceivingModeEnum), 
        nullable=False,
        index=True
    )
    
    # Forward to central flag
    forward_to_central = Column(Boolean, default=False, nullable=False)
    
    # Courier AWB (nullable)
    courier_awb = Column(String(100), nullable=True, index=True)
    
    # Receipt date (from form)
    receipt_date = Column(String(10), nullable=False)  # Store as string for consistency with frontend
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False,
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationship to LabTest
    lab_tests = relationship("LabTest", back_populates="receipt", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Receipt(id={self.id}, receiver_name='{self.receiver_name}', company='{self.company}')>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        return {
            "id": str(self.id),
            "receiver_name": self.receiver_name,
            "contact_number": self.contact_number,
            "date": self.receipt_date,
            "branch": self.branch,
            "company": self.company,
            "count_of_boxes": self.count_boxes,
            "receiving_mode": self.receiving_mode.value,
            "forward_to_chennai": self.forward_to_central,  # Map to frontend field name
            "awb_no": self.courier_awb,  # Map to frontend field name
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
