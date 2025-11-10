#!/bin/bash

# NPC World - API Test Script
# Tests all major API endpoints

set -e

API_URL="${API_URL:-http://localhost:3000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-your_secure_admin_token_here}"

echo "🧪 NPC World API Test Suite"
echo "============================"
echo "API URL: $API_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4
    local description=$5
    
    echo -n "Testing: $description... "
    
    if [ -n "$auth" ]; then
        headers="-H \"Authorization: Bearer $ADMIN_TOKEN\""
    else
        headers=""
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(eval curl -s -w "\\n%{http_code}" $headers "$API_URL$endpoint")
    else
        response=$(eval curl -s -w "\\n%{http_code}" -X $method $headers -H "Content-Type: application/json" -d "'$data'" "$API_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
        echo "  Response: $body"
    fi
}

echo "📋 Public Endpoints"
echo "-------------------"
test_endpoint "GET" "/" "" "" "Root endpoint"
test_endpoint "GET" "/health" "" "" "Health check"
test_endpoint "GET" "/worlds" "" "" "List worlds"
test_endpoint "GET" "/worlds/1" "" "" "Get world 1"
test_endpoint "GET" "/entities/1" "" "" "Get entity 1"
test_endpoint "POST" "/entities/1/idea" '{"idea_text":"Test idea","priority":5}' "" "Add idea to entity"

echo ""
echo "🔐 Admin Endpoints (with auth)"
echo "------------------------------"
test_endpoint "GET" "/admin/worlds" "" "auth" "Admin: List worlds"
test_endpoint "GET" "/admin/entities" "" "auth" "Admin: List entities"
test_endpoint "GET" "/admin/events?limit=10" "" "auth" "Admin: List events"
test_endpoint "GET" "/admin/stats" "" "auth" "Admin: Get stats"

echo ""
echo "🚫 Admin Endpoints (without auth - should fail)"
echo "-----------------------------------------------"
echo -n "Testing: Admin endpoint without auth... "
response=$(curl -s -w "\n%{http_code}" "$API_URL/admin/stats")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} (Correctly rejected with HTTP 401)"
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401, got HTTP $http_code)"
fi

echo ""
echo "✅ Test suite complete!"
echo ""
echo "💡 To test WebSocket, use the client at: http://localhost:8080/client.html"
