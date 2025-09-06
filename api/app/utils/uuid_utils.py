"""
UUID utilities for consistent UUID handling across the application.
This module ensures UUIDs are always handled as strings for maximum database compatibility.
"""
import uuid
from typing import Union, Optional
from sqlalchemy import TypeDecorator, String


class StringUUID(TypeDecorator):
    """
    A SQLAlchemy type decorator that stores UUIDs as strings.
    This ensures compatibility across all database backends (SQLite, PostgreSQL, MySQL, etc.)
    """
    impl = String(36)
    cache_ok = True
    
    def process_bind_param(self, value: Union[str, uuid.UUID, None], dialect) -> Optional[str]:
        """Convert UUID objects to strings when storing in database"""
        if value is None:
            return None
        elif isinstance(value, uuid.UUID):
            return str(value)
        elif isinstance(value, str):
            # For UUID fields, we expect UUID format, but we'll be more permissive
            # to handle edge cases in queries where non-UUID strings might be compared
            if validate_uuid(value):
                return value
            else:
                # If it's not a valid UUID format, we still pass it through
                # This allows for search queries that might not be UUIDs
                # The database query will simply fail to match, which is expected
                return value
        else:
            raise TypeError(f"Expected UUID or string, got {type(value)}")
    
    def process_result_value(self, value: Optional[str], dialect) -> Optional[str]:
        """Return UUIDs as strings when reading from database"""
        return value


def generate_uuid() -> str:
    """Generate a new UUID as a string"""
    return str(uuid.uuid4())


def validate_uuid(uuid_string: str) -> bool:
    """Validate if a string is a proper UUID format"""
    try:
        uuid.UUID(uuid_string)
        return True
    except (ValueError, TypeError):
        return False


def normalize_uuid(value: Union[str, uuid.UUID, None]) -> Optional[str]:
    """Convert any UUID representation to a normalized string format"""
    if value is None:
        return None
    elif isinstance(value, uuid.UUID):
        return str(value)
    elif isinstance(value, str):
        if validate_uuid(value):
            return value
        else:
            raise ValueError(f"Invalid UUID format: {value}")
    else:
        raise TypeError(f"Expected UUID or string, got {type(value)}")


def safe_uuid_compare(uuid1: Union[str, uuid.UUID, None], uuid2: Union[str, uuid.UUID, None]) -> bool:
    """Safely compare two UUIDs regardless of their type"""
    try:
        norm1 = normalize_uuid(uuid1)
        norm2 = normalize_uuid(uuid2)
        return norm1 == norm2
    except (ValueError, TypeError):
        return False
