import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel
from ..utils.uuid_utils import StringUUID


class FinalStatus(enum.Enum):
    DRAFT = "DRAFT"
    READY_FOR_APPROVAL = "READY_FOR_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class CommunicationStatus(enum.Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"


class CommunicationChannel(enum.Enum):
    COURIER = "COURIER"
    IN_PERSON = "IN_PERSON"
    EMAIL = "EMAIL"


class Report(BaseModel):
    __tablename__ = "reports"

    labtest_id = Column(StringUUID, ForeignKey("labtests.id", ondelete="CASCADE"), nullable=False)
    retesting_requested = Column(Boolean, default=False, nullable=False)
    final_status = Column(Enum(FinalStatus), default=FinalStatus.DRAFT, nullable=False)
    approved_by = Column(String, nullable=True)
    comm_status = Column(Enum(CommunicationStatus), default=CommunicationStatus.PENDING, nullable=False)
    comm_channel = Column(Enum(CommunicationChannel), default=CommunicationChannel.EMAIL, nullable=False)
    communicated_to_accounts = Column(Boolean, default=False, nullable=False)

    # Relationships
    labtest = relationship("LabTest", back_populates="reports")
    invoices = relationship("Invoice", back_populates="report", cascade="all, delete-orphan")
    retest_requests = relationship("RetestRequest", back_populates="report", cascade="all, delete-orphan")

    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            "labtest_id": str(self.labtest_id),
            "final_status": self.final_status.value if self.final_status else None,
            "comm_status": self.comm_status.value if self.comm_status else None,
            "comm_channel": self.comm_channel.value if self.comm_channel else None,
        })
        return base_dict
