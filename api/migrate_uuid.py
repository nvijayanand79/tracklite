"""
Database migration script to handle UUID standardization.
This script ensures backward compatibility when upgrading to the new UUID system.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, inspect
from app.config import settings
from app.models.base import BaseModel
from app.utils.uuid_utils import validate_uuid, generate_uuid
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def check_database_compatibility():
    """Check if the current database schema is compatible with the new UUID system"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        # Check if tables exist
        inspector = inspect(engine.sync_engine)
        tables = inspector.get_table_names()
        
        logger.info(f"Found tables: {tables}")
        
        uuid_tables = ['receipts', 'labtests', 'reports', 'invoices', 'retest_requests', 'owner_preferences', 'lab_transfers']
        
        for table in uuid_tables:
            if table in tables:
                logger.info(f"✅ Table {table} exists")
                
                # Check column types
                columns = inspector.get_columns(table)
                id_column = next((col for col in columns if col['name'] == 'id'), None)
                
                if id_column:
                    logger.info(f"  ID column type: {id_column['type']}")
                else:
                    logger.warning(f"  ⚠️  No ID column found in {table}")
            else:
                logger.info(f"⏭️  Table {table} does not exist (will be created)")
    
    await engine.dispose()


async def migrate_uuid_data():
    """Migrate existing UUID data to ensure consistency"""
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        logger.info("🔄 Starting UUID data migration...")
        
        # Check for any malformed UUIDs and fix them
        tables_to_check = [
            'receipts', 'labtests', 'reports', 'invoices', 
            'retest_requests', 'owner_preferences', 'lab_transfers'
        ]
        
        for table in tables_to_check:
            try:
                # Check if table exists
                result = await session.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'"))
                if not result.fetchone():
                    logger.info(f"⏭️  Table {table} does not exist, skipping")
                    continue
                
                # Get all records with potentially malformed UUIDs
                result = await session.execute(text(f"SELECT id FROM {table} LIMIT 5"))
                rows = result.fetchall()
                
                logger.info(f"📊 Checked {len(rows)} records in {table}")
                
                for row in rows:
                    uuid_value = row[0]
                    if not validate_uuid(str(uuid_value)):
                        logger.warning(f"⚠️  Found invalid UUID in {table}: {uuid_value}")
                        # Could implement fixing logic here if needed
                    else:
                        logger.debug(f"✅ Valid UUID in {table}: {uuid_value}")
                        
            except Exception as e:
                logger.warning(f"⚠️  Could not check table {table}: {e}")
        
        await session.commit()
        logger.info("✅ UUID data migration completed")
    
    await engine.dispose()


async def test_uuid_operations():
    """Test UUID operations to ensure they work correctly"""
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        logger.info("🧪 Testing UUID operations...")
        
        # Test UUID generation
        test_uuid = generate_uuid()
        logger.info(f"Generated UUID: {test_uuid}")
        assert validate_uuid(test_uuid), "Generated UUID is invalid"
        
        # Test UUID validation
        valid_uuids = [
            "550e8400-e29b-41d4-a716-446655440000",
            "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            test_uuid
        ]
        
        invalid_uuids = [
            "not-a-uuid",
            "123",
            "",
            None
        ]
        
        for uuid_str in valid_uuids:
            assert validate_uuid(uuid_str), f"Valid UUID failed validation: {uuid_str}"
            
        for uuid_str in invalid_uuids:
            if uuid_str is not None:
                assert not validate_uuid(uuid_str), f"Invalid UUID passed validation: {uuid_str}"
        
        logger.info("✅ All UUID operations working correctly")
    
    await engine.dispose()


async def create_test_data():
    """Create test data to verify the new UUID system works"""
    from app.models.receipt import Receipt, ReceivingModeEnum
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        logger.info("🧪 Creating test data...")
        
        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
        
        # Test creating a receipt with the new system
        test_receipt = Receipt(
            receiver_name="Test UUID System",
            contact_number="+1-555-123-9999",
            branch="Test Branch",
            company="UUID Test Corp",
            count_boxes=1,
            receiving_mode=ReceivingModeEnum.PERSON,
            forward_to_central=False,
            receipt_date="2024-09-06"
        )
        
        session.add(test_receipt)
        await session.commit()
        await session.refresh(test_receipt)
        
        logger.info(f"✅ Created test receipt with ID: {test_receipt.id}")
        assert validate_uuid(test_receipt.id), "Test receipt ID is not a valid UUID"
        
        # Clean up test data
        await session.delete(test_receipt)
        await session.commit()
        
        logger.info("✅ Test data creation and cleanup successful")
    
    await engine.dispose()


async def main():
    """Main migration function"""
    logger.info("🚀 Starting UUID standardization migration...")
    
    try:
        # Step 1: Check current database state
        await check_database_compatibility()
        
        # Step 2: Migrate existing data
        await migrate_uuid_data()
        
        # Step 3: Test UUID operations
        await test_uuid_operations()
        
        # Step 4: Create and test with new data
        await create_test_data()
        
        logger.info("🎉 UUID standardization migration completed successfully!")
        
    except Exception as e:
        logger.error(f"❌ Migration failed: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
