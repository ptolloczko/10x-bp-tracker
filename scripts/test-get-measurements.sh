#!/bin/bash

echo "🧪 Testing GET /api/measurements endpoint"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000"

# Helper function to make GET request
get_measurements() {
  local query="$1"
  curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/measurements$query" \
    -H "Accept: application/json"
}

# Test 1: Success - Default pagination (200)
echo "Test 1: Get measurements with default pagination"
response=$(get_measurements "")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  echo "✅ PASS - Status: $status"
  page=$(echo "$body" | jq -r '.page')
  page_size=$(echo "$body" | jq -r '.page_size')
  total=$(echo "$body" | jq -r '.total')
  count=$(echo "$body" | jq -r '.data | length')
  echo "   Page: $page, Page Size: $page_size, Total: $total, Records: $count"
else
  echo "❌ FAIL - Expected 200, got $status"
  echo "Response: $body"
fi
echo ""

# Test 2: Success - Custom pagination (200)
echo "Test 2: Custom pagination (page=2, page_size=5)"
response=$(get_measurements "?page=2&page_size=5")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  page=$(echo "$body" | jq -r '.page')
  page_size=$(echo "$body" | jq -r '.page_size')
  count=$(echo "$body" | jq -r '.data | length')
  
  if [ "$page" = "2" ] && [ "$page_size" = "5" ] && [ "$count" = "5" ]; then
    echo "✅ PASS - Status: $status, Pagination correct"
  else
    echo "❌ FAIL - Pagination incorrect (page=$page, page_size=$page_size, count=$count)"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 3: Success - Filter by single level (200)
echo "Test 3: Filter by level=optimal"
response=$(get_measurements "?level=optimal")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  levels=$(echo "$body" | jq -r '.data[].level' | sort -u)
  if [ "$levels" = "optimal" ]; then
    echo "✅ PASS - Status: $status, All records are 'optimal'"
  else
    echo "❌ FAIL - Found other levels: $levels"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 4: Success - Filter by multiple levels (200)
echo "Test 4: Filter by level=optimal,normal"
response=$(get_measurements "?level=optimal,normal")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  levels=$(echo "$body" | jq -r '.data[].level' | sort -u | tr '\n' ',' | sed 's/,$//')
  if [[ "$levels" =~ ^(normal|optimal)(,(normal|optimal))?$ ]]; then
    echo "✅ PASS - Status: $status, Levels: $levels"
  else
    echo "❌ FAIL - Unexpected levels: $levels"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 5: Success - Filter by level=hypertensive_crisis (200)
echo "Test 5: Filter by level=hypertensive_crisis"
response=$(get_measurements "?level=hypertensive_crisis")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  levels=$(echo "$body" | jq -r '.data[].level' | sort -u)
  if [ "$levels" = "hypertensive_crisis" ]; then
    echo "✅ PASS - Status: $status, All records are 'hypertensive_crisis'"
  else
    echo "❌ FAIL - Found other levels: $levels"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 6: Success - Sort ascending (200)
echo "Test 6: Sort ascending (sort=asc)"
response=$(get_measurements "?sort=asc&page_size=3")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  dates=$(echo "$body" | jq -r '.data[].measured_at')
  first_date=$(echo "$dates" | head -n 1)
  last_date=$(echo "$dates" | tail -n 1)
  
  if [[ "$first_date" < "$last_date" ]]; then
    echo "✅ PASS - Status: $status, Dates ascending"
    echo "   First: $first_date, Last: $last_date"
  else
    echo "❌ FAIL - Dates not in ascending order"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 7: Success - Sort descending (200)
echo "Test 7: Sort descending (sort=desc, default)"
response=$(get_measurements "?sort=desc&page_size=3")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  dates=$(echo "$body" | jq -r '.data[].measured_at')
  first_date=$(echo "$dates" | head -n 1)
  last_date=$(echo "$dates" | tail -n 1)
  
  if [[ "$first_date" > "$last_date" ]]; then
    echo "✅ PASS - Status: $status, Dates descending"
    echo "   First: $first_date, Last: $last_date"
  else
    echo "❌ FAIL - Dates not in descending order"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 8: Success - Filter by date range (from) (200)
echo "Test 8: Filter by from date (from=2024-11-09T15:00:00Z)"
response=$(get_measurements "?from=2024-11-09T15:00:00Z")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  count=$(echo "$body" | jq -r '.total')
  oldest=$(echo "$body" | jq -r '.data[-1].measured_at')
  
  if [[ "$oldest" > "2024-11-09T15:00:00" ]]; then
    echo "✅ PASS - Status: $status, Total: $count, Oldest: $oldest"
  else
    echo "❌ FAIL - Found record older than filter: $oldest"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 9: Success - Filter by date range (to) (200)
echo "Test 9: Filter by to date (to=2024-11-09T10:00:00Z)"
response=$(get_measurements "?to=2024-11-09T10:00:00Z&page_size=5")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  count=$(echo "$body" | jq -r '.total')
  newest=$(echo "$body" | jq -r '.data[0].measured_at')
  
  if [[ "$newest" < "2024-11-09T10:00:00" ]]; then
    echo "✅ PASS - Status: $status, Total: $count, Newest: $newest"
  else
    echo "❌ FAIL - Found record newer than filter: $newest"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 10: Success - Combined filters (200)
echo "Test 10: Combined filters (level=grade1,grade2&from=2024-11-09T00:00:00Z&sort=asc)"
response=$(get_measurements "?level=grade1,grade2&from=2024-11-09T00:00:00Z&sort=asc&page_size=5")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  count=$(echo "$body" | jq -r '.total')
  levels=$(echo "$body" | jq -r '.data[].level' | sort -u | tr '\n' ',' | sed 's/,$//')
  
  echo "✅ PASS - Status: $status, Total: $count, Levels: $levels"
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 11: Validation error - invalid page (400)
echo "Test 11: Validation error - invalid page (page=0)"
response=$(get_measurements "?page=0")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
fi
echo ""

# Test 12: Validation error - invalid page_size (400)
echo "Test 12: Validation error - page_size > 100"
response=$(get_measurements "?page_size=150")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
fi
echo ""

# Test 13: Validation error - invalid sort value (400)
echo "Test 13: Validation error - invalid sort value"
response=$(get_measurements "?sort=invalid")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
fi
echo ""

# Test 14: Validation error - invalid level value (400)
echo "Test 14: Validation error - invalid level value"
response=$(get_measurements "?level=invalid_level")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
fi
echo ""

# Test 15: Validation error - invalid date format (400)
echo "Test 15: Validation error - invalid from date format"
response=$(get_measurements "?from=2024-11-09")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "400" ]; then
  echo "✅ PASS - Status: $status (validation error)"
  echo "Response: $body"
else
  echo "❌ FAIL - Expected 400, got $status"
fi
echo ""

# Test 16: Response structure validation
echo "Test 16: Response structure validation"
response=$(get_measurements "?page_size=1")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  required_fields=("data" "page" "page_size" "total")
  all_present=true
  
  for field in "${required_fields[@]}"; do
    if echo "$body" | jq -e ".$field" > /dev/null 2>&1; then
      echo "  ✓ Field '$field' present"
    else
      echo "  ✗ Field '$field' missing"
      all_present=false
    fi
  done
  
  # Check measurement fields
  measurement_fields=("id" "sys" "dia" "pulse" "level" "measured_at" "created_at" "updated_at")
  for field in "${measurement_fields[@]}"; do
    if echo "$body" | jq -e ".data[0].$field" > /dev/null 2>&1; then
      echo "  ✓ Measurement field '$field' present"
    else
      echo "  ✗ Measurement field '$field' missing"
      all_present=false
    fi
  done
  
  # Verify internal fields are NOT present
  if echo "$body" | jq -e '.data[0].user_id' > /dev/null 2>&1; then
    echo "  ✗ Field 'user_id' should not be exposed"
    all_present=false
  else
    echo "  ✓ Field 'user_id' properly hidden"
  fi
  
  if echo "$body" | jq -e '.data[0].deleted' > /dev/null 2>&1; then
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

# Test 17: Empty result set
echo "Test 17: Empty result set (future date filter)"
response=$(get_measurements "?from=2025-12-31T00:00:00Z")
body=$(echo "$response" | head -n -1)
status=$(echo "$response" | tail -n 1)

if [ "$status" = "200" ]; then
  total=$(echo "$body" | jq -r '.total')
  count=$(echo "$body" | jq -r '.data | length')
  
  if [ "$total" = "0" ] && [ "$count" = "0" ]; then
    echo "✅ PASS - Status: $status, Empty result set handled correctly"
  else
    echo "❌ FAIL - Expected empty result (total=$total, count=$count)"
  fi
else
  echo "❌ FAIL - Expected 200, got $status"
fi
echo ""

# Test 18: Cache-Control header
echo "Test 18: Cache-Control header"
headers=$(curl -s -I -X GET "$BASE_URL/api/measurements")
if echo "$headers" | grep -qi "cache-control: no-store"; then
  echo "✅ PASS - Cache-Control header present"
else
  echo "❌ FAIL - Cache-Control header missing or incorrect"
fi
echo ""

echo "=========================================="
echo "✅ Testing completed"

