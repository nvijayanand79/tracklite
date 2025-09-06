from sqlalchemy import Column, String, Integer, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

from .base import BaseModel


class ReceivingModeEnum(enum.Enum):
    PERSON = "PERSON"
    COURIER = "COURIER"


class Receipt(BaseModel):
    __tablename__ = "receipts"
    
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

    # Relationship to LabTest
    lab_tests = relationship("LabTest", back_populates="receipt", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Receipt(id={self.id}, receiver_name='{self.receiver_name}', company='{self.company}')>"
    
    def to_dict(self):
        """Convert model to dictionary for API responses"""
        base_dict = super().to_dict()
        
        # Add custom field mappings for frontend compatibility
        base_dict.update({
            "date": self.receipt_date,
            "count_of_boxes": self.count_boxes,
            "receiving_mode": self.receiving_mode.value,
            "forward_to_chennai": self.forward_to_central,
            "awb_no": self.courier_awb,
            "tracking_number": self.courier_awb,  # Backwards-compatible alias
        })
        
        return base_dict
