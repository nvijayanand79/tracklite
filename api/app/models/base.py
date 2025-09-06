"""
Base model with standardized UUID handling for maximum deployment compatibility.
"""
from sqlalchemy import Column, DateTime, String
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declared_attr
from ..db import Base
from ..utils.uuid_utils import generate_uuid, StringUUID


class UUIDMixin:
    """Mixin class that provides standardized UUID primary key"""
    
    @declared_attr
    def id(cls):
        return Column(
            StringUUID,
            primary_key=True,
            default=generate_uuid,
            nullable=False,
            index=True
        )


class TimestampMixin:
    """Mixin class that provides created_at and updated_at timestamps"""
    
    @declared_attr
    def created_at(cls):
        return Column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False,
            index=True
        )
    
    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime(timezone=True),
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False
        )


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """
    Base model class with UUID primary key and timestamps.
    All models should inherit from this to ensure consistent UUID handling.
    """
    __abstract__ = True
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id='{self.id}')>"
    
    def to_dict(self, exclude_fields=None):
        """Convert model to dictionary for API responses"""
        exclude_fields = exclude_fields or []
        result = {}
        
        for column in self.__table__.columns:
            field_name = column.name
            if field_name not in exclude_fields:
                value = getattr(self, field_name)
                if value is not None:
                    # Handle datetime serialization
                    if hasattr(value, 'isoformat'):
                        result[field_name] = value.isoformat()
                    else:
                        result[field_name] = value
                else:
                    result[field_name] = None
        
        return result
