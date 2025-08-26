#!/usr/bin/env python3
"""
Simple script to add some sample receipts to the in-memory storage for testing.
Run this after starting the FastAPI server to populate some test data.
"""

import requests
import json
from datetime import datetime, timedelta

# API base URL
BASE_URL = "http://localhost:8000"

# Sample receipts data
sample_receipts = [
    {
        "receiverName": "Alice Johnson",
        "contactNumber": "+91-9876543210",
        "date": (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d"),
        "branch": "Chennai",
        "company": "TechCorp India",
        "countOfBoxes": 3,
        "receivingMode": "Person",
        "forwardToChennai": False
    },
    {
        "receiverName": "Bob Smith",
        "contactNumber": "+91-9876543211",
        "date": (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d"),
        "branch": "Mumbai",
        "company": "DataSys Ltd",
        "countOfBoxes": 5,
        "receivingMode": "Courier",
        "forwardToChennai": False,
        "awbNo": "AWB123456789"
    },
    {
        "receiverName": "Carol Davis",
        "contactNumber": "+91-9876543212",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "branch": "Bangalore",
        "company": "BioTech Solutions",
        "countOfBoxes": 2,
        "receivingMode": "Person",
        "forwardToChennai": True,
        "awbNo": "AWB987654321"
    },
    {
        "receiverName": "David Wilson",
        "contactNumber": "+91-9876543213",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "branch": "Delhi",
        "company": "MedLab Diagnostics",
        "countOfBoxes": 1,
        "receivingMode": "Courier",
        "forwardToChennai": False,
        "awbNo": "AWB555666777"
    },
    {
        "receiverName": "Eva Rodriguez",
        "contactNumber": "+91-9876543214",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "branch": "Chennai",
        "company": "HealthCheck Labs",
        "countOfBoxes": 4,
        "receivingMode": "Person",
        "forwardToChennai": False
    }
]

def create_sample_receipts():
    """Create sample receipts via API calls"""
    print("Creating sample receipts...")
    
    for i, receipt_data in enumerate(sample_receipts, 1):
        try:
            response = requests.post(
                f"{BASE_URL}/receipts",
                json=receipt_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                receipt = response.json()
                print(f"✓ Receipt {i}: {receipt['receiverName']} - {receipt['id']}")
            else:
                print(f"✗ Failed to create receipt {i}: {response.status_code} - {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("✗ Connection failed. Make sure the FastAPI server is running on http://localhost:8000")
            return
        except Exception as e:
            print(f"✗ Error creating receipt {i}: {str(e)}")
    
    print("\nFetching all receipts...")
    try:
        response = requests.get(f"{BASE_URL}/receipts")
        if response.status_code == 200:
            receipts = response.json()
            print(f"✓ Total receipts in system: {len(receipts)}")
        else:
            print(f"✗ Failed to fetch receipts: {response.status_code}")
    except Exception as e:
        print(f"✗ Error fetching receipts: {str(e)}")
    
    print("\nFetching statistics...")
    try:
        response = requests.get(f"{BASE_URL}/receipts/stats/summary")
        if response.status_code == 200:
            stats = response.json()
            print(f"✓ Statistics: {json.dumps(stats, indent=2)}")
        else:
            print(f"✗ Failed to fetch statistics: {response.status_code}")
    except Exception as e:
        print(f"✗ Error fetching statistics: {str(e)}")

if __name__ == "__main__":
    create_sample_receipts()
