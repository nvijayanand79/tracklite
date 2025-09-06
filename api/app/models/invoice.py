import enum
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, Enum, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from .base import BaseModel
from ..utils.uuid_utils import StringUUID


class InvoiceStatus(enum.Enum):
    DRAFT = "DRAFT"
    ISSUED = "ISSUED"
    SENT = "SENT"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class Invoice(BaseModel):
    __tablename__ = "invoices"

    report_id = Column(StringUUID, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False)
    invoice_no = Column(String(50), unique=True, nullable=False, index=True)
    status = Column(Enum(InvoiceStatus), default=InvoiceStatus.DRAFT, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)

    # Relationships
    report = relationship("Report", back_populates="invoices")

    def to_dict(self):
        base_dict = super().to_dict()
        base_dict.update({
            "report_id": str(self.report_id),
            "status": self.status.value if self.status else None,
            "amount": float(self.amount) if self.amount else None,
            "issued_at": self.issued_at.isoformat() if self.issued_at else None,
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
        })
        return base_dict
