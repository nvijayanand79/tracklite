"""
Demo data initialization for TraceLite
Creates sample data for demonstration purposes
"""
import asyncio
import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
import os
import sys

# Add the app directory to Python path
sys.path.append('/app')

from app.db import Base
from app.models.receipt import Receipt, ReceiptStatus
from app.models.labtest import LabTest, TestStatus, LabReportStatus
from app.models.report import Report, FinalStatus, CommunicationStatus, CommunicationChannel
from app.models.invoice import Invoice, InvoiceStatus
from app.models.owner import RetestRequest, OwnerPreference
from app.config import settings

async def init_demo_data():
    """Initialize demo data for TraceLite"""
    
    # Create database engine
    engine = create_async_engine(
        "sqlite+aiosqlite:///./data/tracklite.db",
        echo=True
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Check if demo data already exists
        result = await session.execute(select(Receipt))
        existing_receipts = result.scalars().all()
        
        if existing_receipts:
            print("Demo data already exists, skipping initialization...")
            return
        
        print("Initializing demo data...")
        
        # Create sample receipts
        receipts_data = [
            {
                "receipt_no": "RCP-001",
                "customer_name": "Acme Corp",
                "customer_email": "contact@acme.com",
                "customer_phone": "+1-555-0101",
                "sample_description": "Water Quality Testing - Municipal Supply",
                "collection_date": datetime.now() - timedelta(days=10),
                "received_date": datetime.now() - timedelta(days=9),
                "receipt_status": ReceiptStatus.RECEIVED
            },
            {
                "receipt_no": "RCP-002", 
                "customer_name": "TechStart Inc",
                "customer_email": "lab@techstart.com",
                "customer_phone": "+1-555-0102",
                "sample_description": "Soil Contamination Analysis",
                "collection_date": datetime.now() - timedelta(days=7),
                "received_date": datetime.now() - timedelta(days=6),
                "receipt_status": ReceiptStatus.RECEIVED
            },
            {
                "receipt_no": "RCP-003",
                "customer_name": "GreenEnergy Solutions",
                "customer_email": "samples@greenenergy.com", 
                "customer_phone": "+1-555-0103",
                "sample_description": "Air Quality Monitoring - Industrial Site",
                "collection_date": datetime.now() - timedelta(days=5),
                "received_date": datetime.now() - timedelta(days=4),
                "receipt_status": ReceiptStatus.RECEIVED
            }
        ]
        
        receipts = []
        for receipt_data in receipts_data:
            receipt = Receipt(**receipt_data)
            session.add(receipt)
            receipts.append(receipt)
        
        await session.flush()  # Get IDs
        
        # Create lab tests
        labtests_data = [
            {
                "receipt_id": receipts[0].id,
                "lab_doc_no": "LAB-2024-001",
                "lab_person": "Dr. Sarah Johnson",
                "test_status": TestStatus.COMPLETED,
                "lab_report_status": LabReportStatus.SIGNED_OFF,
                "remarks": "Standard water quality parameters tested"
            },
            {
                "receipt_id": receipts[1].id,
                "lab_doc_no": "LAB-2024-002", 
                "lab_person": "Dr. Michael Chen",
                "test_status": TestStatus.COMPLETED,
                "lab_report_status": LabReportStatus.READY,
                "remarks": "Heavy metals and organic compounds analysis"
            },
            {
                "receipt_id": receipts[2].id,
                "lab_doc_no": "LAB-2024-003",
                "lab_person": "Dr. Emily Rodriguez",
                "test_status": TestStatus.IN_PROGRESS,
                "lab_report_status": LabReportStatus.DRAFT,
                "remarks": "PM2.5, PM10, and volatile organic compounds"
            }
        ]
        
        labtests = []
        for labtest_data in labtests_data:
            labtest = LabTest(**labtest_data)
            session.add(labtest)
            labtests.append(labtest)
            
        await session.flush()  # Get IDs
        
        # Create reports
        reports_data = [
            {
                "labtest_id": labtests[0].id,
                "retesting_requested": False,
                "final_status": FinalStatus.APPROVED,
                "approved_by": "Dr. Sarah Johnson",
                "comm_status": CommunicationStatus.SENT,
                "comm_channel": CommunicationChannel.EMAIL,
                "communicated_to_accounts": True
            },
            {
                "labtest_id": labtests[1].id,
                "retesting_requested": False,
                "final_status": FinalStatus.APPROVED,
                "approved_by": "Dr. Michael Chen", 
                "comm_status": CommunicationStatus.PENDING,
                "comm_channel": CommunicationChannel.EMAIL,
                "communicated_to_accounts": False
            },
            {
                "labtest_id": labtests[2].id,
                "retesting_requested": False,
                "final_status": FinalStatus.DRAFT,
                "approved_by": None,
                "comm_status": CommunicationStatus.PENDING,
                "comm_channel": CommunicationChannel.EMAIL,
                "communicated_to_accounts": False
            }
        ]
        
        reports = []
        for report_data in reports_data:
            report = Report(**report_data)
            session.add(report)
            reports.append(report)
            
        await session.flush()  # Get IDs
        
        # Create invoices
        invoices_data = [
            {
                "report_id": reports[0].id,
                "invoice_no": "INV-2024-001",
                "amount": 1250.00,
                "status": InvoiceStatus.PAID,
                "issued_at": datetime.now() - timedelta(days=8),
                "paid_at": datetime.now() - timedelta(days=3)
            },
            {
                "report_id": reports[1].id,
                "invoice_no": "INV-2024-002",
                "amount": 1850.00,
                "status": InvoiceStatus.PENDING,
                "issued_at": datetime.now() - timedelta(days=5),
                "paid_at": None
            }
        ]
        
        invoices = []
        for invoice_data in invoices_data:
            invoice = Invoice(**invoice_data)
            session.add(invoice)
            invoices.append(invoice)
        
        # Create owner preferences (for demo OTP logins)
        preferences_data = [
            {
                "customer_email": "contact@acme.com",
                "notification_enabled": True,
                "preferred_channel": CommunicationChannel.EMAIL
            },
            {
                "customer_email": "lab@techstart.com", 
                "notification_enabled": True,
                "preferred_channel": CommunicationChannel.EMAIL
            },
            {
                "customer_email": "samples@greenenergy.com",
                "notification_enabled": False,
                "preferred_channel": CommunicationChannel.EMAIL
            }
        ]
        
        for pref_data in preferences_data:
            preference = OwnerPreference(**pref_data)
            session.add(preference)
        
        # Commit all demo data
        await session.commit()
        
        print("Demo data initialization completed successfully!")
        print("\nDemo credentials:")
        print("- Email: contact@acme.com (OTP: 123456)")
        print("- Email: lab@techstart.com (OTP: 123456)")
        print("- Email: samples@greenenergy.com (OTP: 123456)")
        print("\nTracking IDs for public search:")
        print(f"- {receipts[0].receipt_no} / {labtests[0].lab_doc_no}")
        print(f"- {receipts[1].receipt_no} / {labtests[1].lab_doc_no}")
        print(f"- {receipts[2].receipt_no} / {labtests[2].lab_doc_no}")
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(init_demo_data())
