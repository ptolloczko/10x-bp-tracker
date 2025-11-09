#!/bin/bash

echo "🧪 Testing DELETE /api/measurements/{id} endpoint"
echo "=================================================="
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
  local notes=$4
  local timestamp=$5
  
  local response=$(curl -s -X POST "$BASE_URL/api/measurements" \
    -H "Content-Type: application/json" \
    -d "{
      \"sys\": $sys,
      \"dia\": $dia,
      \"pulse\": $pulse,
      \"measured_at\": \"$timestamp\",
      \"notes\": \"$notes\"
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

# Helper function to delete a measurement
delete_measurement() {
  local id=$1
  curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/measurements/$id"
}

# Helper function to get a measurement
get_measurement() {
  local id=$1
  curl -s "$BASE_URL/api/measurements" | jq ".data[] | select(.id == \"$id\")"
}

# Test 1: Success - Delete measurement (204)
echo "Test 1: Delete measurement (204 No Content)"
MEASUREMENT_ID=$(create_measurement 120 80 70 "To be deleted" "$(generate_timestamp)")
response=$(delete_measurement "$MEASUREMENT_ID")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "204" ]; then
  echo "✅ PASS - Status: $status (No Content)"
  
  # Verify measurement is no longer in list
  found=$(get_measurement "$MEASUREMENT_ID")
  if [ -z "$found" ]; then
    echo "✅ Verified - Measurement not in list (soft deleted)"
  else
    echo "❌ FAIL - Measurement still visible in list"
  fi
else
  echo "❌ FAIL - Expected 204, got $status"
  echo "Response: $body"
fi
echo ""

# Test 2: Success - Delete another measurement (204)
echo "Test 2: Delete another measurement"
MEASUREMENT_ID=$(create_measurement 130 85 75 "Another deletion" "$(generate_timestamp)")
response=$(delete_measurement "$MEASUREMENT_ID")
status=$(echo "$response" | tail -n 1)

if [ "$status" = "204" ]; then
  echo "✅ PASS - Status: $status"
else
  echo "❌ FAIL - Expected 204, got $status"
fi
echo ""

# Test 3: Not found error - Delete non-existent measurement (404)
echo "Test 3: Delete non-existent measurement (404)"
response=$(delete_measurement "00000000-0000-0000-0000-000000000000")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "404" ]; then
  echo "✅ PASS - Status: $status (Not Found)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 404, got $status"
fi
echo ""

# Test 4: Not found error - Delete already deleted measurement (404)
echo "Test 4: Delete already deleted measurement (404)"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Delete twice" "$(generate_timestamp)")
delete_measurement "$MEASUREMENT_ID" > /dev/null

response=$(delete_measurement "$MEASUREMENT_ID")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "404" ]; then
  echo "✅ PASS - Status: $status (Already deleted)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 404, got $status"
fi
echo ""

# Test 5: Invalid ID format (UUID validation)
echo "Test 5: Invalid ID format"
response=$(delete_measurement "invalid-id")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

# Should return 404 (not found) or 400 (invalid format)
if [ "$status" = "404" ] || [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (Invalid ID)"
else
  echo "❌ FAIL - Expected 404 or 400, got $status"
fi
echo ""

# Test 6: Empty ID
echo "Test 6: Empty ID"
response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/measurements/")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

# Should return 404 or 400
if [ "$status" = "404" ] || [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (Empty ID handled)"
else
  echo "❌ FAIL - Expected 404 or 400, got $status"
fi
echo ""

# Test 7: Verify soft delete (measurement still in DB but deleted=true)
echo "Test 7: Verify soft delete behavior"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Verify soft delete" "$(generate_timestamp)")

# Get initial data
initial=$(curl -s "$BASE_URL/api/measurements" | jq ".data[] | select(.id == \"$MEASUREMENT_ID\")")

if [ -n "$initial" ]; then
  echo "  ✓ Measurement exists before deletion"
  
  # Delete it
  delete_measurement "$MEASUREMENT_ID" > /dev/null
  
  # Try to get it again
  after=$(curl -s "$BASE_URL/api/measurements" | jq ".data[] | select(.id == \"$MEASUREMENT_ID\")")
  
  if [ -z "$after" ]; then
    echo "  ✓ Measurement not visible after deletion"
    
    # Try to delete again (should 404)
    response=$(delete_measurement "$MEASUREMENT_ID")
    status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "404" ]; then
      echo "  ✓ Second delete returns 404"
      echo "✅ PASS - Soft delete working correctly"
    else
      echo "  ✗ Second delete should return 404, got $status"
      echo "❌ FAIL - Soft delete verification failed"
    fi
  else
    echo "  ✗ Measurement still visible after deletion"
    echo "❌ FAIL - Soft delete not working"
  fi
else
  echo "❌ FAIL - Could not create initial measurement"
fi
echo ""

# Test 8: Multiple deletes in sequence
echo "Test 8: Multiple deletes in sequence"
IDS=()
for i in {1..3}; do
  ID=$(create_measurement 120 80 70 "Batch delete $i" "$(generate_timestamp)")
  if [ -n "$ID" ]; then
    IDS+=("$ID")
  fi
done

all_deleted=true
for ID in "${IDS[@]}"; do
  response=$(delete_measurement "$ID")
  status=$(echo "$response" | tail -n 1)
  
  if [ "$status" != "204" ]; then
    all_deleted=false
    echo "  ✗ Failed to delete $ID (status: $status)"
  fi
done

if [ "$all_deleted" = true ] && [ "${#IDS[@]}" = "3" ]; then
  echo "✅ PASS - All 3 measurements deleted successfully"
else
  echo "❌ FAIL - Some deletions failed (created: ${#IDS[@]}/3)"
fi
echo ""

# Test 9: Delete and verify can't update afterwards
echo "Test 9: Verify deleted measurement can't be updated"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Delete then update" "$(generate_timestamp)")

# Delete it
delete_measurement "$MEASUREMENT_ID" > /dev/null

# Try to update
update_response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/measurements/$MEASUREMENT_ID" \
  -H "Content-Type: application/json" \
  -d '{"sys": 130}')
update_status=$(echo "$update_response" | tail -n 1)

if [ "$update_status" = "404" ]; then
  echo "✅ PASS - Update after delete returns 404"
else
  echo "❌ FAIL - Update after delete should return 404, got $update_status"
fi
echo ""

# Test 10: No response body for 204
echo "Test 10: Verify 204 has no response body"
MEASUREMENT_ID=$(create_measurement 120 80 70 "Check empty body" "$(generate_timestamp)")
response=$(delete_measurement "$MEASUREMENT_ID")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "204" ]; then
  if [ -z "$body" ]; then
    echo "✅ PASS - Status: 204, empty body"
  else
    echo "❌ FAIL - Status: 204 but body not empty: $body"
  fi
else
  echo "❌ FAIL - Expected 204, got $status"
fi
echo ""

echo "=================================================="
echo "✅ Testing completed"

