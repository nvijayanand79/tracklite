#!/bin/bash
# Test script for TraceLite Docker setup

echo "🧪 Testing TraceLite Docker Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (got $response, expected $expected_code)"
        return 1
    fi
}

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Test API health
test_endpoint "http://localhost:8000/health" "API Health Check"

# Test API docs
test_endpoint "http://localhost:8000/docs" "API Documentation"

# Test public tracking endpoint
echo -n "Testing public tracking... "
tracking_response=$(curl -s -X POST "http://localhost:8000/owner/track" \
    -H "Content-Type: application/json" \
    -d '{"tracking_id": "RCP-001"}' 2>/dev/null)

if echo "$tracking_response" | grep -q "receipt_no"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

# Test frontend
test_endpoint "http://localhost" "Frontend Home Page"

# Test OTP initialization
echo -n "Testing OTP initialization... "
otp_response=$(curl -s -X POST "http://localhost:8000/auth/owner-email-otp-init" \
    -H "Content-Type: application/json" \
    -d '{"email": "contact@acme.com"}' 2>/dev/null)

if echo "$otp_response" | grep -q "success"; then
    echo -e "${GREEN}✓ PASS${NC}"
else
    echo -e "${RED}✗ FAIL${NC}"
fi

echo ""
echo "🎯 Demo Access Information:"
echo "   Frontend: http://localhost"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📧 Demo Login Emails:"
echo "   - contact@acme.com"
echo "   - lab@techstart.com" 
echo "   - samples@greenenergy.com"
echo "   OTP: 123456 (for all accounts)"
echo ""
echo "🔍 Demo Tracking IDs:"
echo "   - RCP-001 / LAB-2024-001"
echo "   - RCP-002 / LAB-2024-002"
echo "   - RCP-003 / LAB-2024-003"
echo ""
echo "✅ Testing completed! Check the results above."
