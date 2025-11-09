#!/bin/bash

echo "🧪 Testing PUT /api/measurements/{id} endpoint"
echo "==============================================="
echo ""

BASE_URL="http://localhost:3000"

# Counter for unique timestamps
TEST_COUNTER=0

# Helper function to generate unique timestamp
generate_timestamp() {
  TEST_COUNTER=$((TEST_COUNTER + 1))
  # Use current time with nanoseconds for uniqueness
  date -u +"%Y-%m-%dT%H:%M:%S.%6NZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S.$(shuf -i 100000-999999 -n 1)Z"
}

# Helper function to create a test measurement
create_measurement() {
  local sys=$1
  local dia=$2
  local pulse=$3
  local notes="$4"
  local timestamp=$5
  
  local notes_field=""
  if [ -n "$notes" ]; then
    notes_field=",\"notes\": \"$notes\""
  fi
  
  local response=$(curl -s -X POST "$BASE_URL/api/measurements" \
    -H "Content-Type: application/json" \
    -d "{
      \"sys\": $sys,
      \"dia\": $dia,
      \"pulse\": $pulse,
      \"measured_at\": \"$timestamp\"$notes_field
    }")
  
  local id=$(echo "$response" | jq -r '.id // empty')
  
  if [ -z "$id" ] || [ "$id" = "null" ]; then
    echo "ERROR: Failed to create measurement" >&2
    echo "$response" >&2
    echo ""
    return 1
  fi
  
  echo "$id"
}

# Helper function to update a measurement
update_measurement() {
  local id=$1
  local data=$2
  curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/measurements/$id" \
    -H "Content-Type: application/json" \
    -d "$data"
}

# Test 1: Success - Update sys value (200)
echo "Test 1: Update sys value (should reclassify)"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ" 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%SZ")
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$TIMESTAMP")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"sys": 145}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  if [ "$status" = "200" ]; then
    sys=$(echo "$body" | jq -r '.sys')
    dia=$(echo "$body" | jq -r '.dia')
    level=$(echo "$body" | jq -r '.level')
    
    if [ "$sys" = "145" ] && [ "$dia" = "80" ] && [ "$level" = "grade1" ]; then
      echo "✅ PASS - Status: $status, sys updated, level reclassified to grade1"
    else
      echo "❌ FAIL - Values incorrect (sys=$sys, dia=$dia, level=$level)"
    fi
  else
    echo "❌ FAIL - Expected 200, got $status"
    echo "Response: $body"
  fi
fi
echo ""

# Test 2: Success - Update dia value (200)
echo "Test 2: Update dia value (should reclassify)"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"dia": 95}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  if [ "$status" = "200" ]; then
    dia=$(echo "$body" | jq -r '.dia')
    level=$(echo "$body" | jq -r '.level')
    
    if [ "$dia" = "95" ] && [ "$level" = "grade1" ]; then
      echo "✅ PASS - Status: $status, dia updated, level reclassified to grade1"
    else
      echo "❌ FAIL - Values incorrect (dia=$dia, level=$level)"
    fi
  else
    echo "❌ FAIL - Expected 200, got $status"
  fi
fi
echo ""

# Test 3: Success - Update notes only (200)
echo "Test 3: Update notes only (no reclassification)"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"notes": "Updated notes"}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  if [ "$status" = "200" ]; then
    notes=$(echo "$body" | jq -r '.notes')
    level=$(echo "$body" | jq -r '.level')
    
    if [ "$notes" = "Updated notes" ] && [ "$level" = "normal" ]; then
      echo "✅ PASS - Status: $status, notes updated, level unchanged"
    else
      echo "❌ FAIL - Values incorrect (notes=$notes, level=$level)"
    fi
  else
    echo "❌ FAIL - Expected 200, got $status"
  fi
fi
echo ""

# Test 4: Success - Update multiple fields (200)
echo "Test 4: Update multiple fields at once"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"sys": 190, "dia": 105, "pulse": 90, "notes": "High BP alert"}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)

  if [ "$status" = "200" ]; then
    sys=$(echo "$body" | jq -r '.sys')
    dia=$(echo "$body" | jq -r '.dia')
    pulse=$(echo "$body" | jq -r '.pulse')
    level=$(echo "$body" | jq -r '.level')
    notes=$(echo "$body" | jq -r '.notes')
    
    if [ "$sys" = "190" ] && [ "$dia" = "105" ] && [ "$pulse" = "90" ] && [ "$level" = "grade3" ] && [ "$notes" = "High BP alert" ]; then
      echo "✅ PASS - Status: $status, all fields updated correctly"
    else
      echo "❌ FAIL - Values incorrect"
    fi
  else
    echo "❌ FAIL - Expected 200, got $status"
  fi
fi
echo ""

# Test 5: Success - Update measured_at (200)
echo "Test 5: Update measured_at timestamp"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  # Generate a unique timestamp for the update (but still in the past)
  NEW_TIMESTAMP="2024-11-09T$(date +%H):$(date +%M):$(date +%S).$(shuf -i 100000-999999 -n 1)Z"
  response=$(update_measurement "$MEASUREMENT_ID" "{\"measured_at\": \"$NEW_TIMESTAMP\"}")
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "200" ]; then
    measured_at=$(echo "$body" | jq -r '.measured_at')
    
    if [[ "$measured_at" == "2024-11-09"* ]]; then
      echo "✅ PASS - Status: $status, measured_at updated"
    else
      echo "❌ FAIL - measured_at incorrect: $measured_at"
    fi
else
    echo "❌ FAIL - Expected 200, got $status"
fi
fi
echo ""

# Test 6: Validation error - sys < dia (400)
echo "Test 6: Validation error - sys < dia when updating both"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"sys": 80, "dia": 120}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "400" ]; then
    echo "✅ PASS - Status: $status (validation error)"
    echo "Response: $body"
else
    echo "❌ FAIL - Expected 400, got $status"
fi
fi
echo ""

# Test 7: Validation error - invalid value (400)
echo "Test 7: Validation error - negative pulse"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"pulse": -10}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "400" ]; then
    echo "✅ PASS - Status: $status (validation error)"
    echo "Response: $body"
else
    echo "❌ FAIL - Expected 400, got $status"
fi
fi
echo ""

# Test 8: Validation error - future date (400)
echo "Test 8: Validation error - future measured_at date"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"measured_at": "2025-12-31T12:00:00Z"}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "400" ]; then
    echo "✅ PASS - Status: $status (validation error)"
    echo "Response: $body"
else
    echo "❌ FAIL - Expected 400, got $status"
fi
fi
echo ""

# Test 9: Duplicate timestamp error (400)
echo "Test 9: Duplicate timestamp when updating measured_at"
MEASUREMENT_ID1=$(create_measurement 120 80 70 "First" "$(generate_timestamp)")
MEASUREMENT_ID2=$(create_measurement 130 85 75 "Second" "$(generate_timestamp)")
response=$(update_measurement "$MEASUREMENT_ID2" '{"measured_at": "$(generate_timestamp)"}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (duplicate error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
fi
echo ""

# Test 10: Not found error (404)
echo "Test 10: Update non-existent measurement"
response=$(update_measurement "00000000-0000-0000-0000-000000000000" '{"sys": 130}')
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "404" ]; then
  echo "✅ PASS - Status: $status (not found)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 404, got $status"
fi
echo ""

# Test 11: Invalid JSON (400)
echo "Test 11: Invalid JSON format"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/measurements/$MEASUREMENT_ID" \
    -H "Content-Type: application/json" \
    -d "not valid json")
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "400" ]; then
    echo "✅ PASS - Status: $status (invalid JSON)"
    echo "Response: $body"
else
    echo "❌ FAIL - Expected 400, got $status"
fi
fi
echo ""

# Test 12: Empty body (partial update allowed) (200)
echo "Test 12: Empty body (should succeed - no changes)"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "200" ]; then
    echo "✅ PASS - Status: $status (empty update allowed)"
else
    echo "❌ FAIL - Expected 200, got $status"
    echo "Response: $body"
fi
fi
echo ""

# Test 13: Response structure validation
echo "Test 13: Response structure validation"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Original" "$(generate_timestamp)")
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  response=$(update_measurement "$MEASUREMENT_ID" '{"sys": 125}')
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
if [ "$status" = "200" ]; then
    required_fields=("id" "sys" "dia" "pulse" "level" "measured_at" "created_at" "updated_at")
    all_present=true
    
    for field in "${required_fields[@]}"; do
      if echo "$body" | jq -e ".$field" > /dev/null 2>&1; then
        echo "  ✓ Field '$field' present"
      else
        echo "  ✗ Field '$field' missing"
        all_present=false
      fi
    done
    
    # Verify internal fields are NOT present
    if echo "$body" | jq -e '.user_id' > /dev/null 2>&1; then
      echo "  ✗ Field 'user_id' should not be exposed"
      all_present=false
    else
      echo "  ✓ Field 'user_id' properly hidden"
    fi
    
    if echo "$body" | jq -e '.deleted' > /dev/null 2>&1; then
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
fi
echo ""

echo "==============================================="
echo "✅ Testing completed"

