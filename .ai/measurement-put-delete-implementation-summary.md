# PUT & DELETE /api/measurements/{id} - Implementation Summary

## Overview
Successfully implemented UPDATE and DELETE operations for individual blood pressure measurements, completing the full CRUD functionality of the measurements API.

## Endpoints Implemented

### 1. PUT /api/measurements/{id}
**Purpose:** Update existing blood pressure measurement with re-validation and re-classification.

**Request:**
- Method: `PUT`
- URL: `/api/measurements/{id}`
- Headers: `Content-Type: application/json`
- Body: Partial update object (all fields optional)
  ```json
  {
    "sys"?: number,        // 1-32767
    "dia"?: number,        // 1-32767
    "pulse"?: number,      // 1-32767
    "measured_at"?: string, // ISO 8601, not in future
    "notes"?: string       // max 255 chars
  }
  ```

**Response:**
- `200 OK`: Updated measurement (MeasurementDTO)
- `400 Bad Request`: Validation error or duplicate timestamp
- `404 Not Found`: Measurement doesn't exist
- `500 Internal Server Error`: Server error

**Business Rules:**
1. All fields are optional (partial updates allowed)
2. Empty body `{}` is valid (no-op update)
3. Values are re-validated after merging with existing data
4. `sys` must be >= `dia` (validated after merge)
5. `measured_at` cannot be in the future
6. `measured_at` must be unique per user
7. BP classification is re-computed if `sys` or `dia` changed
8. New entry is logged in `interpretation_logs` table
9. `updated_at` timestamp is automatically updated

### 2. DELETE /api/measurements/{id}
**Purpose:** Soft-delete a blood pressure measurement.

**Request:**
- Method: `DELETE`
- URL: `/api/measurements/{id}`

**Response:**
- `204 No Content`: Successfully deleted
- `404 Not Found`: Measurement doesn't exist or already deleted
- `500 Internal Server Error`: Server error

**Business Rules:**
1. Soft delete: sets `deleted=true` instead of removing record
2. Deleted measurements are excluded from GET queries
3. Cannot delete already deleted measurements (returns 404)
4. Cannot delete non-existent measurements (returns 404)

## Files Created/Modified

### 1. `/src/lib/validators/measurement.ts`
**Added:** `UpdateMeasurementSchema`
- All fields optional using `.optional()`
- Same validation rules as `CreateMeasurementSchema` for each field
- Includes `refine` for `sys >= dia` (only if both provided)
- Allows empty object `{}`

```typescript
export const UpdateMeasurementSchema = z.object({
  sys: z.number().int().positive().max(32767).optional(),
  dia: z.number().int().positive().max(32767).optional(),
  pulse: z.number().int().positive().max(32767).optional(),
  measured_at: z.string().datetime().optional().refine(...),
  notes: z.string().max(255).optional(),
}).refine(
  (data) => !data.sys || !data.dia || data.sys >= data.dia,
  { message: "...", path: ["sys"] }
);
```

### 2. `/src/lib/services/measurement.service.ts`
**Added Methods:**

#### `update(id, data, userId): Promise<MeasurementDTO>`
1. Fetches existing measurement by ID and user
2. Merges partial `data` with existing record
3. **Validates `sys >= dia` after merge** (critical!)
4. Re-classifies BP if `sys` or `dia` changed
5. Updates `measurements` table
6. Creates new `interpretation_logs` entry
7. Returns updated `MeasurementDTO`
8. Throws `MeasurementNotFoundError` if not found
9. Throws `MeasurementDuplicateError` if timestamp conflict

**Key Implementation Detail:**
```typescript
const updatedData = {
  sys: data.sys ?? existing.sys,
  dia: data.dia ?? existing.dia,
  pulse: data.pulse ?? existing.pulse,
  measured_at: data.measured_at ?? existing.measured_at,
  notes: data.notes ?? existing.notes,
};

// Critical validation after merge!
if (updatedData.sys < updatedData.dia) {
  throw new Error("Systolic must be >= diastolic");
}
```

#### `delete(id, userId): Promise<void>`
1. Performs soft delete: `UPDATE measurements SET deleted=true WHERE id=...`
2. Verifies deletion by checking record exists with `deleted=true`
3. Throws `MeasurementNotFoundError` if:
   - Record doesn't exist
   - Record already deleted
   - Record belongs to different user

### 3. `/src/pages/api/measurements/[id].ts`
**Created** new API route file for individual measurement operations.

#### `PUT` Handler:
- Extracts `id` from `context.params.id`
- Parses and validates body with `UpdateMeasurementSchema`
- Calls `MeasurementService.update()`
- Maps errors to HTTP status codes:
  - `ZodError` → 400
  - `MeasurementNotFoundError` → 404
  - `MeasurementDuplicateError` → 400
  - Generic `Error` (sys < dia validation) → 400
  - Others → 500

#### `DELETE` Handler:
- Extracts `id` from `context.params.id`
- Calls `MeasurementService.delete()`
- Maps errors to HTTP status codes:
  - `MeasurementNotFoundError` → 404
  - Others → 500
- Returns `204 No Content` on success

## Testing

### Test Script: `/scripts/test-put-measurement.sh`
**13 comprehensive test scenarios:**

1. ✅ Update sys value (triggers reclassification)
2. ✅ Update dia value (triggers reclassification)
3. ✅ Update notes only (no reclassification)
4. ✅ Update multiple fields at once
5. ✅ Update measured_at timestamp
6. ✅ Validation error: sys < dia
7. ✅ Validation error: negative pulse
8. ✅ Validation error: future date
9. ✅ Duplicate timestamp error
10. ✅ Update non-existent measurement (404)
11. ✅ Invalid JSON format
12. ✅ Empty body (no-op update)
13. ✅ Response structure validation

**All 13 tests passing!**

### Test Script: `/scripts/test-delete-measurement.sh`
**10 comprehensive test scenarios:**

1. ✅ Successful deletion
2. ✅ Delete non-existent measurement (404)
3. ✅ Delete already deleted measurement (404)
4. ✅ Invalid UUID format
5. ✅ Empty ID
6. ✅ Verify soft-delete (record still exists)
7. ✅ Verify deleted excluded from GET
8. ✅ Cannot update deleted measurement
9. ✅ Multiple deletions
10. ✅ Response status and headers

**All 10 tests passing!**

## Key Technical Decisions

### 1. Partial Updates
- All fields in `UpdateMeasurementSchema` are `.optional()`
- Empty body `{}` is valid (updates only `updated_at`)
- Missing fields retain their existing values

### 2. Post-Merge Validation
- Zod validates individual fields before merge
- **Additional validation required after merging** with existing data
- Example: `sys < dia` check must happen after merge
- This catches cases where only one value is updated

### 3. Soft Delete Implementation
- Uses `deleted` boolean flag instead of removing records
- Maintains data integrity and audit trail
- Allows for potential "undelete" functionality later
- Deleted records excluded via `WHERE deleted = false` in queries

### 4. Interpretation Logs
- Every UPDATE creates a new log entry
- Logs are immutable (never updated or deleted)
- Captures full history of BP classification changes
- Includes `notes` field for context

### 5. Error Handling Strategy
- Custom errors: `MeasurementNotFoundError`, `MeasurementDuplicateError`
- Service layer throws semantic errors
- API route maps to HTTP status codes
- Consistent error response format

## Challenges & Solutions

### Challenge 1: sys < dia Validation After Partial Update
**Problem:** Updating only `sys` or only `dia` could create invalid state.

**Example:**
```typescript
// Existing: sys=120, dia=80
// Update: { dia: 130 }
// Result: sys=120, dia=130 ❌ INVALID!
```

**Solution:** Added explicit validation after merging:
```typescript
const updatedData = { ...existing, ...data };
if (updatedData.sys < updatedData.dia) {
  throw new Error("...");
}
```

### Challenge 2: Test Script Timestamp Duplicates
**Problem:** Hardcoded timestamps in test script caused duplicate errors on repeated runs.

**Solution:** Implemented `generate_timestamp()` function with nanosecond precision:
```bash
generate_timestamp() {
  TEST_COUNTER=$((TEST_COUNTER + 1))
  date -u +"%Y-%m-%dT%H:%M:%S.%6NZ" 2>/dev/null || \
    date -u +"%Y-%m-%dT%H:%M:%S.$(shuf -i 100000-999999 -n 1)Z"
}
```

### Challenge 3: Test Script Error Handling
**Problem:** When `create_measurement()` failed, tests proceeded with invalid ID ("null").

**Solution:** Added validation in helper function:
```bash
create_measurement() {
  local id=$(echo "$response" | jq -r '.id // empty')
  
  if [ -z "$id" ] || [ "$id" = "null" ]; then
    echo "ERROR: Failed to create measurement" >&2
    echo ""
    return 1
  fi
  
  echo "$id"
}
```

And wrapped all tests:
```bash
MEASUREMENT_ID=$(create_measurement ...)
if [ -z "$MEASUREMENT_ID" ]; then
  echo "❌ FAIL - Could not create measurement"
else
  # ... rest of test
fi
```

### Challenge 4: Notes Field Type Mismatch
**Problem:** Zod's `.optional()` infers `string | undefined`, but database expects `string | null`.

**Solution:** Used nullish coalescing when inserting:
```typescript
notes: data.notes ?? null
```

## Documentation Updates

### README.md
- Added complete API documentation for PUT and DELETE endpoints
- Included request/response examples
- Documented business rules
- Added curl command examples
- Updated testing scripts section

## Performance Considerations

1. **Single Query Pattern**: Update operation uses 3 queries:
   - SELECT (fetch existing)
   - UPDATE (update measurement)
   - INSERT (log entry)
   
2. **Transaction Consideration**: Not implemented yet, but UPDATE + INSERT should ideally be in a transaction to ensure consistency.

3. **Soft Delete Performance**: Deleted records accumulate over time. Consider:
   - Periodic archival/cleanup
   - Separate table for deleted records
   - Or hard delete after retention period

## Security Considerations

1. **Authorization**: Currently uses `DEFAULT_USER_ID` placeholder
   - Ready for JWT-based auth (just replace with `context.locals.userId`)
   
2. **Input Validation**: Comprehensive Zod schemas prevent injection attacks

3. **Error Messages**: Don't leak sensitive information (e.g., database details)

## Future Enhancements

1. **Batch Operations**: 
   - `PATCH /api/measurements/bulk` for multiple updates
   - `DELETE /api/measurements/bulk` for multiple deletions

2. **Undelete Functionality**:
   - `POST /api/measurements/{id}/restore`

3. **Audit Trail**:
   - Track who made changes (user_id in logs)
   - Track when changes were made
   - Could leverage existing `interpretation_logs`

4. **Optimistic Locking**:
   - Add `version` field to prevent lost updates
   - Return HTTP 409 Conflict on version mismatch

5. **Validation Rules**:
   - Add business rules for "realistic" BP values
   - Flag suspicious measurements for review

## Conclusion

Successfully implemented full CRUD operations for blood pressure measurements:
- ✅ CREATE (POST /api/measurements)
- ✅ READ (GET /api/measurements, GET /api/measurements/{id})
- ✅ UPDATE (PUT /api/measurements/{id})
- ✅ DELETE (DELETE /api/measurements/{id})

All endpoints include:
- Comprehensive validation
- Proper error handling
- Business rule enforcement
- Complete test coverage
- Full documentation

The implementation is production-ready pending:
- JWT authentication integration
- Transaction management for multi-query operations
- Performance optimization if needed at scale

