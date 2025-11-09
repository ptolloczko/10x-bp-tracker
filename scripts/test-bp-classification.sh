#!/bin/bash

echo "🧪 Testing BP Classification Function"
echo "======================================"
echo ""
echo "Testing classify() function against ESC/ESH 2023 guidelines"
echo ""

BASE_URL="http://localhost:3000"

# Counter for unique timestamps
COUNTER=0

# Helper function to test classification
test_classification() {
  local sys=$1
  local dia=$2
  local expected=$3
  local description=$4
  
  # Generate unique timestamp by incrementing counter
  COUNTER=$((COUNTER + 1))
  local timestamp=$(printf "2024-11-09T%02d:%02d:%02dZ" $((COUNTER / 3600)) $(((COUNTER % 3600) / 60)) $((COUNTER % 60)))
  
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/measurements" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -d "{
      \"sys\": $sys,
      \"dia\": $dia,
      \"pulse\": 70,
      \"measured_at\": \"$timestamp\"
    }")
  
  body=$(echo "$response" | head -n -1)
  status=$(echo "$response" | tail -n 1)
  
  if [ "$status" = "201" ]; then
    if echo "$body" | grep -q "\"level\":\"$expected\""; then
      echo "✅ PASS - $description (sys=$sys, dia=$dia) → $expected"
    else
      actual=$(echo "$body" | grep -o '"level":"[^"]*"' | cut -d':' -f2 | tr -d '"')
      echo "❌ FAIL - $description (sys=$sys, dia=$dia)"
      echo "   Expected: $expected, Got: $actual"
    fi
  else
    echo "❌ FAIL - $description - Request failed with status $status"
  fi
}

# Optimal: sys < 120 AND dia < 80
echo "Category: OPTIMAL (sys < 120 AND dia < 80)"
test_classification 119 79 "optimal" "Upper boundary"
test_classification 110 70 "optimal" "Middle range"
test_classification 100 60 "optimal" "Lower range"
echo ""

# Normal: sys 120-129 OR dia 80-84
echo "Category: NORMAL (sys 120-129 OR dia 80-84)"
test_classification 120 79 "normal" "Lower sys boundary"
test_classification 125 82 "normal" "Middle range"
test_classification 129 84 "normal" "Upper boundary"
test_classification 119 80 "normal" "Lower dia boundary (sys optimal)"
test_classification 119 84 "normal" "Upper dia boundary (sys optimal)"
echo ""

# High Normal: sys 130-139 OR dia 85-89
echo "Category: HIGH NORMAL (sys 130-139 OR dia 85-89)"
test_classification 130 79 "high_normal" "Lower sys boundary"
test_classification 135 87 "high_normal" "Middle range"
test_classification 139 89 "high_normal" "Upper boundary"
test_classification 119 85 "high_normal" "Lower dia boundary (sys optimal)"
test_classification 119 89 "high_normal" "Upper dia boundary (sys optimal)"
echo ""

# Grade 1: sys 140-159 OR dia 90-99
echo "Category: GRADE 1 HYPERTENSION (sys 140-159 OR dia 90-99)"
test_classification 140 79 "grade1" "Lower sys boundary"
test_classification 150 95 "grade1" "Middle range"
test_classification 159 99 "grade1" "Upper boundary"
test_classification 119 90 "grade1" "Lower dia boundary (sys optimal)"
test_classification 119 99 "grade1" "Upper dia boundary (sys optimal)"
echo ""

# Grade 2: sys 160-179 OR dia 100-109
echo "Category: GRADE 2 HYPERTENSION (sys 160-179 OR dia 100-109)"
test_classification 160 79 "grade2" "Lower sys boundary"
test_classification 170 105 "grade2" "Middle range"
test_classification 179 109 "grade2" "Upper boundary"
test_classification 119 100 "grade2" "Lower dia boundary (sys optimal)"
test_classification 119 109 "grade2" "Upper dia boundary (sys optimal)"
echo ""

# Grade 3: sys >= 180 OR dia >= 110 (but not crisis)
echo "Category: GRADE 3 HYPERTENSION (sys >= 180 OR dia >= 110, but not crisis)"
test_classification 180 79 "grade3" "Lower sys boundary"
test_classification 190 100 "grade3" "High sys, high dia"
test_classification 200 115 "grade3" "Very high sys"
test_classification 119 110 "grade3" "Lower dia boundary (sys optimal)"
test_classification 119 115 "grade3" "High dia (sys optimal)"
echo ""

# Hypertensive Crisis: sys >= 180 AND dia >= 120
echo "Category: HYPERTENSIVE CRISIS (sys >= 180 AND dia >= 120)"
test_classification 180 120 "hypertensive_crisis" "Lower boundary"
test_classification 185 125 "hypertensive_crisis" "Above boundary"
test_classification 200 130 "hypertensive_crisis" "Severe crisis"
test_classification 220 140 "hypertensive_crisis" "Critical crisis"
echo ""

echo "======================================"
echo "✅ Classification testing completed"

