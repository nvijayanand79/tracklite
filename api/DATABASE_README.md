# Database Setup with SQLAlchemy and Alembic

This document describes the database implementation for the TraceLite API using SQLAlchemy with async support and Alembic for migrations.

## Architecture Overview

### Database Stack
- **Database**: SQLite with async support (aiosqlite)
- **ORM**: SQLAlchemy 2.0 with async engine
- **Migrations**: Alembic
- **Connection**: Async sessions with dependency injection

### File Structure
```
api/
├── app/
│   ├── db.py                 # Database configuration and session management
│   ├── models/
│   │   ├── __init__.py
│   │   └── receipt.py        # Receipt SQLAlchemy model
│   └── routers/
│       └── receipts.py       # Updated router with DB operations
├── alembic/                  # Alembic migration files
│   ├── versions/
│   │   └── 001_initial_receipt_table.py
│   ├── env.py
│   └── script.py.mako
├── alembic.ini              # Alembic configuration
├── init_db.py               # Database initialization script
└── requirements.txt         # Updated with new dependencies
```

## Installation

### 1. Install Dependencies
```bash
cd api
pip install -r requirements.txt
```

### 2. Initialize Database
```bash
# Option 1: Using the initialization script
python init_db.py

# Option 2: Using Alembic (if you want to use migrations)
alembic upgrade head

# Option 3: Direct initialization (for development)
python -c "import asyncio; from app.db import init_db; asyncio.run(init_db())"
```

## Database Models

### Receipt Model (`app/models/receipt.py`)

```python
class Receipt(Base):
    __tablename__ = "receipts"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Receipt details
    receiver_name = Column(String(255), nullable=False, index=True)
    contact_number = Column(String(50), nullable=False)
    branch = Column(String(100), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    count_boxes = Column(Integer, nullable=False)
    
    # Receiving mode with enum constraint
    receiving_mode = Column(Enum(ReceivingModeEnum), nullable=False)
    
    # Forward to central flag
    forward_to_central = Column(Boolean, default=False, nullable=False)
    
    # Courier AWB (nullable)
    courier_awb = Column(String(100), nullable=True, index=True)
    
    # Receipt date (from form)
    receipt_date = Column(String(10), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### Field Mapping
| Database Field | API Field | Frontend Field | Type | Notes |
|---|---|---|---|---|
| `id` | `id` | `id` | UUID | Primary key |
| `receiver_name` | `receiver_name` | `receiverName` | string | Indexed |
| `contact_number` | `contact_number` | `contactNumber` | string | |
| `branch` | `branch` | `branch` | string | Indexed |
| `company` | `company` | `company` | string | Indexed |
| `count_boxes` | `count_of_boxes` | `countOfBoxes` | integer | |
| `receiving_mode` | `receiving_mode` | `receivingMode` | enum | Person/Courier |
| `forward_to_central` | `forward_to_chennai` | `forwardToChennai` | boolean | |
| `courier_awb` | `awb_no` | `awbNo` | string | Nullable |
| `receipt_date` | `date` | `date` | string | |
| `created_at` | `created_at` | `createdAt` | datetime | Auto-generated |

## Database Configuration (`app/db.py`)

### Async Engine Setup
```python
# Database URL with async SQLite
DATABASE_URL = "sqlite+aiosqlite:///./tracelite.db"

# Async engine with echo for debugging
engine = create_async_engine(DATABASE_URL, echo=True)

# Async session factory
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession)
```

### Dependency Injection
```python
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
```

## Router Updates (`app/routers/receipts.py`)

### Database Operations

#### Create Receipt
```python
@router.post("/receipts", response_model=ReceiptResponse)
async def create_receipt(receipt: ReceiptCreate, db: AsyncSession = Depends(get_db)):
    # Convert to SQLAlchemy model
    db_receipt = Receipt(
        id=uuid.uuid4(),
        receiver_name=receipt.receiver_name,
        # ... other fields
    )
    
    # Save to database
    db.add(db_receipt)
    await db.commit()
    await db.refresh(db_receipt)
    
    return ReceiptResponse(**db_receipt.to_dict())
```

#### Query Receipts
```python
@router.get("/receipts", response_model=List[ReceiptResponse])
async def get_receipts(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Receipt).order_by(Receipt.created_at.desc())
    )
    receipts = result.scalars().all()
    return [ReceiptResponse(**receipt.to_dict()) for receipt in receipts]
```

## Alembic Migrations

### Configuration (`alembic.ini`)
- Uses async SQLite URL: `sqlite+aiosqlite:///./tracelite.db`
- Configured for async operations

### Environment Setup (`alembic/env.py`)
- Imports all models for autogenerate support
- Configured for async migrations
- Handles both online and offline modes

### Initial Migration (`alembic/versions/001_initial_receipt_table.py`)
Creates the receipts table with:
- All required columns and constraints
- Indexes for performance
- Enum type for receiving_mode
- Proper timestamps

### Running Migrations
```bash
# Generate new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Downgrade (if needed)
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

## Production Considerations

### Database URL Configuration
For production, set the `DATABASE_URL` environment variable:
```bash
# PostgreSQL example
export DATABASE_URL="postgresql+asyncpg://user:password@localhost/tracelite"

# MySQL example  
export DATABASE_URL="mysql+aiomysql://user:password@localhost/tracelite"
```

### Performance Optimizations
1. **Indexes**: Critical fields are indexed (receiver_name, branch, company, courier_awb)
2. **Connection Pooling**: Configured in SQLAlchemy engine
3. **Query Optimization**: Use select() for efficient queries
4. **Async Operations**: All database operations are async

### Error Handling
- Automatic transaction rollback on errors
- Proper session cleanup in dependency injection
- Comprehensive error logging

## Testing Database Operations

### Sample Data Script
Use the existing `create_sample_receipts.py` script which now works with the database backend.

### Manual Testing
```python
import asyncio
from app.db import AsyncSessionLocal, init_db
from app.models.receipt import Receipt, ReceivingModeEnum

async def test_database():
    await init_db()
    
    async with AsyncSessionLocal() as session:
        # Create test receipt
        receipt = Receipt(
            receiver_name="Test User",
            contact_number="+91-1234567890",
            branch="Test Branch",
            company="Test Company",
            count_boxes=1,
            receiving_mode=ReceivingModeEnum.PERSON,
            forward_to_central=False,
            receipt_date="2025-08-25"
        )
        
        session.add(receipt)
        await session.commit()
        print(f"Created receipt: {receipt.id}")

# Run test
asyncio.run(test_database())
```

## Migration from In-Memory Storage

The router has been completely updated to use SQLAlchemy instead of the previous in-memory list. Key changes:

1. **Storage**: `receipts_storage` list → SQLAlchemy Receipt model
2. **Operations**: Direct list manipulation → Async SQL queries
3. **Sessions**: No session management → Dependency injection with `get_db()`
4. **Error Handling**: Basic try/catch → Transaction rollback and proper cleanup
5. **Performance**: Linear search → Indexed database queries

The API endpoints remain the same, ensuring backward compatibility with the frontend.
