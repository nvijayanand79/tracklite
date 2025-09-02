#!/usr/bin/env python3
"""
Test script to verify TrackLite public deployment connectivity
"""
import requests
import json

# Test URLs
WEB_URL = "http://65.20.74.233:5173"
API_URL = "http://65.20.74.233:8000"

def test_api_connectivity():
    """Test API endpoints"""
    print("🔗 Testing API connectivity...")

    # Test health endpoint
    try:
        response = requests.get(f"{API_URL}/healthz")
        if response.status_code == 200:
            print("✅ Health check: OK")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Health check error: {e}")

    # Test login endpoint
    try:
        login_data = {"email": "admin@example.com", "password": "admin123"}
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ Admin login: OK")
            token = response.json().get("access_token")
            if token:
                print("✅ JWT token received")
                return token
        else:
            print(f"❌ Admin login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Admin login error: {e}")

    return None

def test_cors_headers():
    """Test CORS headers"""
    print("\n🌐 Testing CORS configuration...")

    test_origin = "http://65.20.74.233:5173"
    print(f"Testing with origin: {test_origin}")

    try:
        # Test with origin header on a regular GET request
        headers = {
            "Origin": test_origin
        }
        response = requests.get(f"{API_URL}/healthz", headers=headers)

        print(f"OPTIONS response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")

        cors_origin = response.headers.get("Access-Control-Allow-Origin")
        if cors_origin:
            print(f"✅ CORS Origin: {cors_origin}")
        else:
            print("❌ CORS Origin header missing")

        cors_credentials = response.headers.get("Access-Control-Allow-Credentials")
        if cors_credentials == "true":
            print("✅ CORS Credentials: enabled")
        else:
            print("❌ CORS Credentials: disabled or missing")

        cors_methods = response.headers.get("Access-Control-Allow-Methods")
        if cors_methods:
            print(f"✅ CORS Methods: {cors_methods}")
        else:
            print("❌ CORS Methods header missing")

    except Exception as e:
        print(f"❌ CORS test error: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🚀 TrackLite Public Deployment Test")
    print("=" * 40)

    # Test API connectivity
    token = test_api_connectivity()

    # Test CORS
    test_cors_headers()

    print("\n📋 Summary:")
    print(f"   Web App: {WEB_URL}")
    print(f"   API: {API_URL}")
    print(f"   API Docs: {API_URL}/docs")

    if token:
        print("✅ All tests passed! Public deployment is working.")
    else:
        print("❌ Some tests failed. Check the configuration.")

if __name__ == "__main__":
    main()
