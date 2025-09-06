"""
Standalone demo initialization script
Run this script to reset and initialize demo data
"""
import asyncio
import sys
import os

# Add the api directory to the path
api_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, api_dir)

# Initialize database before importing other modules
from app.db import init_db
from startup_init import initialize_demo_data

async def main():
    """Main function to initialize demo data"""
    print("🎯 TraceLite Demo Data Initialization")
    print("=====================================")
    print()
    
    try:
        # Initialize database connection first
        await init_db()
        
        # Then initialize demo data
        await initialize_demo_data()
        
        print()
        print("🎉 Demo initialization completed successfully!")
        print()
        print("📋 Demo Data Available:")
        print("   • 3 Receipts with different companies")
        print("   • 3 Lab Tests with tracking IDs:")
        print("     - LAB-2024-001 (Completed)")
        print("     - LAB-2024-002 (Completed)")  
        print("     - LAB-2024-003 (In Progress)")
        print("   • AWB Tracking: AWB123456789")
        print("   • 3 Reports (2 approved)")
        print("   • 2 Invoices")
        print()
        print("🔗 Owner Login Credentials:")
        print("   • Email: contact@acme.com")
        print("   • Email: lab@techstart.com")
        print("   • OTP: 123456 (demo)")
        print()
        print("✅ Ready for demo!")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
