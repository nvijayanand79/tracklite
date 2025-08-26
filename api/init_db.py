#!/usr/bin/env python3
"""
Database initialization script for TraceLite API.
This script initializes the database and runs migrations.
"""

import asyncio
import os
import sys

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import init_db, engine
from app.models.receipt import Receipt  # Import to ensure models are registered


async def initialize_database():
    """Initialize the database and create tables"""
    print("Initializing database...")
    
    try:
        await init_db()
        print("✓ Database initialized successfully!")
        print("✓ Tables created")
        
        # Test the connection
        async with engine.begin() as conn:
            from sqlalchemy import text
            result = await conn.execute(text("SELECT 1"))
            print("✓ Database connection test passed")
            
    except Exception as e:
        print(f"✗ Database initialization failed: {e}")
        return False
    
    return True


async def main():
    """Main function"""
    print("TraceLite Database Initialization")
    print("=" * 40)
    
    success = await initialize_database()
    
    if success:
        print("\nDatabase setup complete!")
        print("\nNext steps:")
        print("1. Start the API server: uvicorn app.main:app --reload")
        print("2. Access API docs at: http://localhost:8000/docs")
        print("3. Test receipts endpoints")
    else:
        print("\nDatabase setup failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
