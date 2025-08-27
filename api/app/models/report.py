import enum
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from ..db import Base


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


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    labtest_id = Column(UUID(as_uuid=True), ForeignKey("labtests.id", ondelete="CASCADE"), nullable=False)
    retesting_requested = Column(Boolean, default=False, nullable=False)
    final_status = Column(Enum(FinalStatus), default=FinalStatus.DRAFT, nullable=False)
    approved_by = Column(String, nullable=True)
    comm_status = Column(Enum(CommunicationStatus), default=CommunicationStatus.PENDING, nullable=False)
    comm_channel = Column(Enum(CommunicationChannel), default=CommunicationChannel.EMAIL, nullable=False)
    communicated_to_accounts = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    labtest = relationship("LabTest", back_populates="reports")
    invoices = relationship("Invoice", back_populates="report", cascade="all, delete-orphan")
    retest_requests = relationship("RetestRequest", back_populates="report", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": str(self.id),
            "labtest_id": str(self.labtest_id),
            "retesting_requested": self.retesting_requested,
            "final_status": self.final_status.value if self.final_status else None,
            "approved_by": self.approved_by,
            "comm_status": self.comm_status.value if self.comm_status else None,
            "comm_channel": self.comm_channel.value if self.comm_channel else None,
            "communicated_to_accounts": self.communicated_to_accounts,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
