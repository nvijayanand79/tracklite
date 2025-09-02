#!/usr/bin/env python3
"""
Test frontend login by making the exact same call the frontend would make
"""
import requests
import json

# Test URLs
WEB_URL = "http://65.20.74.233:5173"
API_URL = "http://65.20.74.233:8000"

def test_frontend_login():
    """Test login exactly as frontend would do it"""
    print("🔐 Testing frontend-style login...")
    
    # Headers that a browser would send
    headers = {
        "Content-Type": "application/json",
        "Origin": WEB_URL,
        "Referer": WEB_URL,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    
    # Login data
    login_data = {
        "email": "admin@example.com",
        "password": "admin123"
    }
    
    try:
        print(f"Making POST request to: {API_URL}/auth/login")
        print(f"Headers: {headers}")
        print(f"Data: {login_data}")
        
        response = requests.post(
            f"{API_URL}/auth/login", 
            json=login_data,
            headers=headers
        )
        
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Login successful!")
            print(f"Token: {result.get('access_token', 'N/A')[:50]}...")
            print(f"User: {result.get('user_info', {})}")
            return True
        else:
            print("❌ Login failed!")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_cors_preflight():
    """Test CORS preflight for login endpoint"""
    print("\n🌐 Testing CORS preflight for login...")
    
    headers = {
        "Origin": WEB_URL,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
    }
    
    try:
        response = requests.options(f"{API_URL}/auth/login", headers=headers)
        print(f"Preflight Status: {response.status_code}")
        print(f"CORS Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ CORS preflight successful!")
            return True
        else:
            print("❌ CORS preflight failed!")
            return False
            
    except Exception as e:
        print(f"❌ CORS preflight error: {e}")
        return False

def main():
    print("🚀 Frontend Login Debug Test")
    print("=" * 50)
    
    # Test CORS preflight first
    cors_ok = test_cors_preflight()
    
    # Test actual login
    login_ok = test_frontend_login()
    
    print("\n📋 Summary:")
    print(f"   CORS Preflight: {'✅' if cors_ok else '❌'}")
    print(f"   Login Request: {'✅' if login_ok else '❌'}")
    
    if cors_ok and login_ok:
        print("✅ Frontend login should work!")
    else:
        print("❌ There are still issues to resolve.")

if __name__ == "__main__":
    main()
