#!/usr/bin/env python3
"""
Debug script to test invoice queries directly using SQLAlchemy
"""
import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import selectinload
from sqlalchemy import select
from app.models.invoice import Invoice
from app.models.report import Report

async def test_invoice_queries():
    # Same database configuration as the app
    DATABASE_URL = "sqlite+aiosqlite:///./data/tracelite.db"
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with AsyncSessionLocal() as session:
        print("=== Testing List All Invoices ===")
        # Query from the list endpoint
        result = await session.execute(
            select(Invoice).options(selectinload(Invoice.report))
        )
        invoices = result.scalars().all()
        print(f"Found {len(invoices)} invoices in list query:")
        for invoice in invoices:
            print(f"  ID: {invoice.id}, Invoice No: {invoice.invoice_no}")
        
        print("\n=== Testing Get Single Invoice ===")
        # Query from the get single endpoint
        target_id = "2f852f2a-ab39-4d8a-bd7d-7cce4f027e33"
        result = await session.execute(
            select(Invoice).options(selectinload(Invoice.report)).where(Invoice.id == target_id)
        )
        invoice = result.scalar_one_or_none()
        
        if invoice:
            print(f"Found invoice: {invoice.id}, Invoice No: {invoice.invoice_no}")
            print(f"Report: {invoice.report}")
        else:
            print(f"Invoice {target_id} not found!")
        
        print("\n=== Testing Simple Query ===")
        # Test without relationship loading
        result = await session.execute(
            select(Invoice).where(Invoice.id == target_id)
        )
        invoice_simple = result.scalar_one_or_none()
        
        if invoice_simple:
            print(f"Found invoice (simple): {invoice_simple.id}, Invoice No: {invoice_simple.invoice_no}")
        else:
            print(f"Invoice {target_id} not found in simple query!")

if __name__ == "__main__":
    asyncio.run(test_invoice_queries())
