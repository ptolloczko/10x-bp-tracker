#!/bin/bash

echo "🧪 Testing GET /api/profile endpoint"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# Test 1: Success (200)
echo "Test 1: Profile exists (200)"
response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/profile" -H "Accept: application/json")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  echo "✅ PASS - Status: $status"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 200, got $status"
  echo "Response: $body"
fi
echo ""

# Test 2: Check Cache-Control header
echo "Test 2: Cache-Control header"
headers=$(curl -s -I -X GET "$BASE_URL/api/profile")
if echo "$headers" | grep -qi "cache-control: no-store"; then
  echo "✅ PASS - Cache-Control header present"
else
  echo "❌ FAIL - Cache-Control header missing or incorrect"
fi
echo ""

# Test 3: Verify response structure
echo "Test 3: Response structure validation"
response=$(curl -s -X GET "$BASE_URL/api/profile" -H "Accept: application/json")
required_fields=("user_id" "timezone" "created_at" "updated_at")

all_present=true
for field in "${required_fields[@]}"; do
  if echo "$response" | grep -q "\"$field\""; then
    echo "  ✓ Field '$field' present"
  else
    echo "  ✗ Field '$field' missing"
    all_present=false
  fi
done

if [ "$all_present" = true ]; then
  echo "✅ PASS - All required fields present"
else
  echo "❌ FAIL - Some required fields missing"
fi
echo ""

echo "======================================"
echo "✅ Testing completed"

