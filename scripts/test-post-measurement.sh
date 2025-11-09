#!/bin/bash

echo "🧪 Testing POST /api/measurements endpoint"
echo "==========================================="
echo ""

BASE_URL="http://localhost:3000"

# Helper function to make POST request
post_measurement() {
  local data="$1"
  curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/measurements" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "$data"
}

# Test 1: Success - Optimal BP (201)
echo "Test 1: Create measurement - Optimal BP (sys=115, dia=75)"
response=$(post_measurement '{
  "sys": 115,
  "dia": 75,
  "pulse": 70,
  "measured_at": "2024-11-09T08:30:00Z",
  "notes": "Morning measurement, feeling good"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "201" ]; then
  echo "✅ PASS - Status: $status"
  echo "Response: $body"
  if echo "$body" | grep -q '"level":"optimal"'; then
    echo "✅ Classification: optimal (correct)"
  else
    echo "❌ Classification incorrect"
  fi
else
  echo "❌ FAIL - Expected 201, got $status"
  echo "Response: $body"
fi
echo ""

# Test 2: Success - Grade 1 Hypertension (201)
echo "Test 2: Create measurement - Grade 1 Hypertension (sys=145, dia=92)"
response=$(post_measurement '{
  "sys": 145,
  "dia": 92,
  "pulse": 82,
  "measured_at": "2024-11-09T20:00:00Z"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "201" ]; then
  echo "✅ PASS - Status: $status"
  echo "Response: $body"
  if echo "$body" | grep -q '"level":"grade1"'; then
    echo "✅ Classification: grade1 (correct)"
  else
    echo "❌ Classification incorrect"
  fi
else
  echo "❌ FAIL - Expected 201, got $status"
  echo "Response: $body"
fi
echo ""

# Test 3: Success - Hypertensive Crisis (201)
echo "Test 3: Create measurement - Hypertensive Crisis (sys=185, dia=125)"
response=$(post_measurement '{
  "sys": 185,
  "dia": 125,
  "pulse": 95,
  "measured_at": "2024-11-09T12:00:00Z"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "201" ]; then
  echo "✅ PASS - Status: $status"
  echo "Response: $body"
  if echo "$body" | grep -q '"level":"hypertensive_crisis"'; then
    echo "✅ Classification: hypertensive_crisis (correct)"
  else
    echo "❌ Classification incorrect"
  fi
else
  echo "❌ FAIL - Expected 201, got $status"
  echo "Response: $body"
fi
echo ""

# Test 4: Validation Error - sys < dia (400)
echo "Test 4: Validation error - sys < dia"
response=$(post_measurement '{
  "sys": 80,
  "dia": 120,
  "pulse": 70,
  "measured_at": "2024-11-09T10:00:00Z"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
  echo "Response: $body"
fi
echo ""

# Test 5: Validation Error - missing required field (400)
echo "Test 5: Validation error - missing pulse field"
response=$(post_measurement '{
  "sys": 120,
  "dia": 80,
  "measured_at": "2024-11-09T11:00:00Z"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
  echo "Response: $body"
fi
echo ""

# Test 6: Validation Error - future date (400)
echo "Test 6: Validation error - future measured_at date"
response=$(post_measurement '{
  "sys": 120,
  "dia": 80,
  "pulse": 70,
  "measured_at": "2025-12-31T12:00:00Z"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
  echo "Response: $body"
fi
echo ""

# Test 7: Validation Error - notes too long (400)
echo "Test 7: Validation error - notes > 255 characters"
long_notes=$(printf 'a%.0s' {1..260})
response=$(post_measurement "{
  \"sys\": 120,
  \"dia\": 80,
  \"pulse\": 70,
  \"measured_at\": \"2024-11-09T13:00:00Z\",
  \"notes\": \"$long_notes\"
}")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
  echo "Response: $body"
fi
echo ""

# Test 8: Duplicate timestamp (400)
echo "Test 8: Duplicate timestamp error"
# First, create a measurement
timestamp="2024-11-09T14:30:00Z"
post_measurement "{
  \"sys\": 120,
  \"dia\": 80,
  \"pulse\": 70,
  \"measured_at\": \"$timestamp\"
}" > /dev/null

# Try to create another with the same timestamp
response=$(post_measurement "{
  \"sys\": 125,
  \"dia\": 85,
  \"pulse\": 75,
  \"measured_at\": \"$timestamp\"
}")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (duplicate error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
  echo "Response: $body"
fi
echo ""

# Test 9: Invalid JSON (400)
echo "Test 9: Invalid JSON format"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/measurements" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "not valid json")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (invalid JSON)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
  echo "Response: $body"
fi
echo ""

# Test 10: Verify response structure
echo "Test 10: Response structure validation"
response=$(post_measurement '{
  "sys": 130,
  "dia": 85,
  "pulse": 72,
  "measured_at": "2024-11-09T15:00:00Z",
  "notes": "After exercise"
}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "201" ]; then
  required_fields=("id" "sys" "dia" "pulse" "level" "measured_at" "created_at" "updated_at")
  all_present=true
  
  for field in "${required_fields[@]}"; do
    if echo "$body" | grep -q "\"$field\""; then
      echo "  ✓ Field '$field' present"
    else
      echo "  ✗ Field '$field' missing"
      all_present=false
    fi
  done
  
  # Verify internal fields are NOT present
  if echo "$body" | grep -q "\"user_id\""; then
    echo "  ✗ Field 'user_id' should not be exposed"
    all_present=false
  else
    echo "  ✓ Field 'user_id' properly hidden"
  fi
  
  if echo "$body" | grep -q "\"deleted\""; then
    echo "  ✗ Field 'deleted' should not be exposed"
    all_present=false
  else
    echo "  ✓ Field 'deleted' properly hidden"
  fi
  
  if [ "$all_present" = true ]; then
    echo "✅ PASS - Response structure valid"
  else
    echo "❌ FAIL - Response structure invalid"
  fi
else
  echo "❌ FAIL - Could not verify structure (status: $status)"
fi
echo ""

echo "==========================================="
echo "✅ Testing completed"

