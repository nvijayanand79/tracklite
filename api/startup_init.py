"""
Startup initialization script for TraceLite demo.
This script ensures clean demo data is available on every startup.
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select
from datetime import datetime, timedelta
import logging

from app.db import engine, AsyncSessionLocal
from app.models.base import BaseModel
from app.models.receipt import Receipt, ReceivingModeEnum
from app.models.labtest import LabTest, TestStatus, LabReportStatus
from app.models.report import Report, FinalStatus, CommunicationStatus, CommunicationChannel
from app.models.invoice import Invoice, InvoiceStatus
from app.utils.uuid_utils import generate_uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def clear_all_data(session: AsyncSession):
    """Clear all existing data from the database"""
    logger.info("🧹 Clearing all existing data...")
    
    # Order matters due to foreign key constraints
    tables_to_clear = [
        'invoices',
        'retest_requests', 
        'reports',
        'lab_transfers',
        'labtests',
        'receipts',
        'owner_preferences'
    ]
    
    for table in tables_to_clear:
        try:
            await session.execute(text(f"DELETE FROM {table}"))
            logger.info(f"   ✅ Cleared {table}")
        except Exception as e:
            logger.warning(f"   ⚠️  Could not clear {table}: {e}")
    
    await session.commit()
    logger.info("✅ All data cleared successfully")


async def create_demo_receipts(session: AsyncSession):
    """Create demo receipts"""
    logger.info("📋 Creating demo receipts...")
    
    receipts_data = [
        {
            "receiver_name": "Acme Corp Representative",
            "contact_number": "+1-555-123-0101",
            "branch": "Main Lab",
            "company": "Acme Corp",
            "count_boxes": 2,
            "receiving_mode": ReceivingModeEnum.PERSON,
            "forward_to_central": False,
            "courier_awb": None,
            "receipt_date": (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
        },
        {
            "receiver_name": "TechStart Lab Manager", 
            "contact_number": "+1-555-123-0102",
            "branch": "Research Lab",
            "company": "TechStart Inc",
            "count_boxes": 3,
            "receiving_mode": ReceivingModeEnum.COURIER,
            "forward_to_central": True,
            "courier_awb": "AWB123456789",
            "receipt_date": (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        },
        {
            "receiver_name": "GreenEnergy Coordinator",
            "contact_number": "+1-555-123-0103",
            "branch": "Environmental Lab",
            "company": "GreenEnergy Solutions",
            "count_boxes": 1,
            "receiving_mode": ReceivingModeEnum.PERSON,
            "forward_to_central": False,
            "courier_awb": None,
            "receipt_date": (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        }
    ]
    
    receipts = []
    for receipt_data in receipts_data:
        receipt = Receipt(**receipt_data)
        session.add(receipt)
        receipts.append(receipt)
        logger.info(f"   📋 Created receipt for {receipt_data['company']}")
    
    await session.flush()
    return receipts


async def create_demo_labtests(session: AsyncSession, receipts):
    """Create demo lab tests"""
    logger.info("🧪 Creating demo lab tests...")
    
    labtests_data = [
        {
            "receipt": receipts[0],
            "lab_doc_no": "LAB-2024-001",
            "lab_person": "Dr. Smith",
            "test_status": TestStatus.COMPLETED,
            "lab_report_status": LabReportStatus.SIGNED_OFF,
            "remarks": "Sample processed successfully"
        },
        {
            "receipt": receipts[1], 
            "lab_doc_no": "LAB-2024-002",
            "lab_person": "Dr. Johnson",
            "test_status": TestStatus.COMPLETED,
            "lab_report_status": LabReportStatus.SIGNED_OFF,
            "remarks": "All tests completed within normal ranges"
        },
        {
            "receipt": receipts[2],
            "lab_doc_no": "LAB-2024-003", 
            "lab_person": "Dr. Williams",
            "test_status": TestStatus.IN_PROGRESS,
            "lab_report_status": LabReportStatus.DRAFT,
            "remarks": "Testing in progress"
        }
    ]
    
    labtests = []
    for labtest_data in labtests_data:
        receipt = labtest_data.pop("receipt")
        labtest = LabTest(
            receipt_id=receipt.id,
            **labtest_data
        )
        session.add(labtest)
        labtests.append(labtest)
        logger.info(f"   🧪 Created lab test {labtest_data['lab_doc_no']}")
    
    await session.flush()
    return labtests


async def create_demo_reports(session: AsyncSession, labtests):
    """Create demo reports"""
    logger.info("📊 Creating demo reports...")
    
    reports_data = [
        {
            "labtest": labtests[0],
            "final_status": FinalStatus.APPROVED,
            "approved_by": "Dr. Admin",
            "comm_status": CommunicationStatus.DELIVERED,
            "comm_channel": CommunicationChannel.EMAIL,
            "retesting_requested": False,
            "communicated_to_accounts": True
        },
        {
            "labtest": labtests[1],
            "final_status": FinalStatus.APPROVED, 
            "approved_by": "Dr. Admin",
            "comm_status": CommunicationStatus.DISPATCHED,
            "comm_channel": CommunicationChannel.COURIER,
            "retesting_requested": False,
            "communicated_to_accounts": True
        },
        {
            "labtest": labtests[2],
            "final_status": FinalStatus.DRAFT,
            "approved_by": None,
            "comm_status": CommunicationStatus.PENDING,
            "comm_channel": CommunicationChannel.EMAIL,
            "retesting_requested": False,
            "communicated_to_accounts": False
        }
    ]
    
    reports = []
    for report_data in reports_data:
        labtest = report_data.pop("labtest")
        report = Report(
            labtest_id=labtest.id,
            **report_data
        )
        session.add(report)
        reports.append(report)
        logger.info(f"   📊 Created report for {labtest.lab_doc_no}")
    
    await session.flush()
    return reports


async def create_demo_invoices(session: AsyncSession, reports):
    """Create demo invoices"""
    logger.info("💰 Creating demo invoices...")
    
    # Only create invoices for approved reports
    approved_reports = [r for r in reports if r.final_status == FinalStatus.APPROVED]
    
    invoices_data = [
        {
            "report": approved_reports[0],
            "invoice_no": f"INV-{datetime.now().year}-0001",
            "status": InvoiceStatus.PAID,
            "amount": 250.00,
            "issued_at": datetime.now() - timedelta(days=5),
            "paid_at": datetime.now() - timedelta(days=2)
        },
        {
            "report": approved_reports[1], 
            "invoice_no": f"INV-{datetime.now().year}-0002",
            "status": InvoiceStatus.SENT,
            "amount": 350.00,
            "issued_at": datetime.now() - timedelta(days=3),
            "paid_at": None
        }
    ]
    
    invoices = []
    for invoice_data in invoices_data:
        report = invoice_data.pop("report")
        invoice = Invoice(
            report_id=report.id,
            **invoice_data
        )
        session.add(invoice)
        invoices.append(invoice)
        logger.info(f"   💰 Created invoice {invoice_data['invoice_no']}")
    
    await session.flush()
    return invoices


async def initialize_demo_data():
    """Initialize complete demo data"""
    logger.info("🚀 Starting demo data initialization...")
    
    # Use the existing engine and session factory from db.py
    try:
        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
            logger.info("✅ Database tables created/verified")
        
        async with AsyncSessionLocal() as session:
            # Clear existing data for fresh start
            await clear_all_data(session)
            
            # Create demo data in order
            receipts = await create_demo_receipts(session)
            labtests = await create_demo_labtests(session, receipts)
            reports = await create_demo_reports(session, labtests)
            invoices = await create_demo_invoices(session, reports)
            
            # Commit all changes
            await session.commit()
            
            logger.info("🎉 Demo data initialization completed successfully!")
            logger.info(f"   📋 Created {len(receipts)} receipts")
            logger.info(f"   🧪 Created {len(labtests)} lab tests")
            logger.info(f"   📊 Created {len(reports)} reports")
            logger.info(f"   💰 Created {len(invoices)} invoices")
            
            # Verify data with sample queries
            await verify_demo_data(session)
            
    except Exception as e:
        logger.error(f"❌ Demo data initialization failed: {e}")
        raise
    finally:
        await engine.dispose()


async def verify_demo_data(session: AsyncSession):
    """Verify that demo data was created correctly"""
    logger.info("🔍 Verifying demo data...")
    
    # Check receipts
    result = await session.execute(select(Receipt))
    receipts = result.scalars().all()
    logger.info(f"   📋 Found {len(receipts)} receipts")
    
    # Check lab tests  
    result = await session.execute(select(LabTest))
    labtests = result.scalars().all()
    logger.info(f"   🧪 Found {len(labtests)} lab tests")
    
    # Check tracking IDs
    for labtest in labtests:
        logger.info(f"      - {labtest.lab_doc_no} ({labtest.test_status.value})")
    
    # Check reports
    result = await session.execute(select(Report))
    reports = result.scalars().all()
    approved_reports = [r for r in reports if r.final_status == FinalStatus.APPROVED]
    logger.info(f"   📊 Found {len(reports)} reports ({len(approved_reports)} approved)")
    
    # Check invoices
    result = await session.execute(select(Invoice))
    invoices = result.scalars().all()
    logger.info(f"   💰 Found {len(invoices)} invoices")
    
    logger.info("✅ Demo data verification completed")


async def check_and_initialize():
    """Check if demo data exists, if not initialize it"""
    logger.info("🔍 Checking demo data status...")
    
    # Use the existing engine and session factory from db.py
    try:
        async with AsyncSessionLocal() as session:
            # Check if receipts exist
            result = await session.execute(select(Receipt))
            existing_receipts = result.scalars().all()
            
            if existing_receipts:
                logger.info(f"📋 Found {len(existing_receipts)} existing receipts")
                logger.info("🔄 Demo data already exists - reinitializing for fresh start...")
                await initialize_demo_data()
            else:
                logger.info("📭 No existing data found - initializing demo data...")
                await initialize_demo_data()
                
    except Exception as e:
        logger.error(f"❌ Demo data check failed: {e}")
        # If there's an error, try to initialize anyway
        logger.info("🔄 Attempting fresh initialization...")
        await initialize_demo_data()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(check_and_initialize())
