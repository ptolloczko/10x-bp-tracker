# REST API Plan

## 1. Resources

| Resource             | DB Table                | Description                                                           |
| -------------------- | ----------------------- | --------------------------------------------------------------------- |
| `User`               | `users` (Supabase Auth) | Authenticated account, managed by Supabase Auth service.              |
| `Profile`            | `profiles`              | Extended user information (one-to-one with `users`).                  |
| `Measurement`        | `measurements`          | Single blood-pressure reading recorded by the user.                   |
| `Interpretation Log` | `interpretation_logs`   | Immutable audit record of each interpretation produced by the system. |

---

## 2. Endpoints

### 2.1 Authentication (delegated to Supabase)

Supabase provides standard `/auth/v1/*` endpoints for sign-up, sign-in, sign-out and token refresh. The frontend should call these directly. All other endpoints below require a valid `Authorization: Bearer <JWT>` header.

---

### 2.2 Profiles

| Method | Path           | Description                                              |
| ------ | -------------- | -------------------------------------------------------- |
| GET    | `/api/profile` | Get current user profile.                                |
| POST   | `/api/profile` | Create profile for a newly registered user (idempotent). |
| PUT    | `/api/profile` | Update profile fields.                                   |

#### 2.2.1 GET /api/profile

- Response 200

```json
{
  "user_id": "uuid",
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-05-12",
  "sex": "male",
  "weight": 80.5,
  "phone": "+48123123123",
  "timezone": "Europe/Warsaw",
  "reminder_enabled": true,
  "created_at": "2025-11-07T12:00:00Z",
  "updated_at": "2025-11-07T12:00:00Z"
}
```

- Errors
  - 401 – unauthorized (missing/invalid JWT)
  - 404 – profile not found (should only happen pre-creation)

#### 2.2.2 POST /api/profile

Creates the row; callable once right after sign-up. Subsequent calls are no-ops (409).

- Request

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "dob": "1990-05-12",
  "sex": "male",
  "weight": 80.5,
  "phone": "+48123123123",
  "timezone": "Europe/Warsaw"
}
```

- Response 201 – returns the full profile object (same as GET).
- Errors: 400 (validation), 409 (already exists), 401.

Field validation:

- `sex` ∈ {"male","female","other"}
- `weight` > 0, max 999.9
- `phone` must be E.164
- `timezone` must be valid IANA identifier

#### 2.2.3 PUT /api/profile

Patch-style replacement; any subset of fields allowed.

- Request (example)

```json
{ "weight": 82.0, "reminder_enabled": false }
```

- Response 200 – updated profile.
- Errors: 400, 401, 404.

---

### 2.3 Measurements

| Method | Path                     | Description                                          |
| ------ | ------------------------ | ---------------------------------------------------- |
| GET    | `/api/measurements`      | List measurements with pagination, filters, sorting. |
| POST   | `/api/measurements`      | Create new measurement (auto-interprets & logs).     |
| GET    | `/api/measurements/{id}` | Fetch single measurement.                            |
| PUT    | `/api/measurements/{id}` | Update measurement (re-interpret & log).             |
| DELETE | `/api/measurements/{id}` | Logical delete (`deleted = true`).                   |

#### Common Query Parameters (GET list)

- `page` (int, default 1)
- `page_size` (int, default 20, max 100)
- `from` / `to` – ISO datetime filter on `measured_at`
- `level` – filter by blood-pressure level(s) (comma-sep)
- `sort` – `measured_at` (`asc`|`desc`, default `desc`)

#### Response Wrapper For Lists

```json
{
  "data": [
    /* array of objects */
  ],
  "page": 1,
  "page_size": 20,
  "total": 143
}
```

#### 2.3.1 POST /api/measurements

- Request

```json
{
  "sys": 120,
  "dia": 80,
  "pulse": 72,
  "measured_at": "2025-11-07T07:45:00Z",
  "notes": "Morning reading"
}
```

- Validation (app + DB):
  - `sys`, `dia`, `pulse` are positive smallints.
  - `sys >= dia` (business rule).
  - Unique (`user_id`,`measured_at`).
- Server side steps:
  1. Insert into `measurements` (level temporarily null).
  2. Classify level per ESC/ESH 2023.
  3. Update row with computed `level`.
  4. Insert row into `interpretation_logs`.
- Response 201

```json
{
  "id": "uuid",
  "sys": 120,
  "dia": 80,
  "pulse": 72,
  "level": "normal",
  "measured_at": "2025-11-07T07:45:00Z",
  "notes": "Morning reading",
  "created_at": "2025-11-07T08:00:00Z",
  "updated_at": "2025-11-07T08:00:00Z"
}
```

- Errors: 400 (validation or duplicate), 401.

#### 2.3.2 PUT /api/measurements/{id}

Re-validates values and re-computes classification; logs a new interpretation entry.

#### 2.3.3 DELETE /api/measurements/{id}

Sets `deleted=true`; returns 204 No Content.

---

### 2.4 Interpretation Logs (read-only)

| Method | Path                                         | Description                               |
| ------ | -------------------------------------------- | ----------------------------------------- |
| GET    | `/api/interpretation-logs`                   | List logs (paginated, most-recent first). |
| GET    | `/api/measurements/{id}/interpretation-logs` | Logs for a particular measurement.        |

Query params identical to measurement list but default sort is `created_at desc`.

---

### 2.5 CSV Export

| Method | Path                       | Description                                                        |
| ------ | -------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/measurements/export` | Download all user measurements as CSV (`text/csv; charset=utf-8`). |

Optional query params `from`, `to`, `level` mirror list filters.

---

### 2.6 Reminder Settings (shortcut)

Can be handled via profile update (`reminder_enabled`), but expose convenience endpoint:

| Method | Path                    | Description              |
| ------ | ----------------------- | ------------------------ |
| POST   | `/api/profile/reminder` | Toggle reminders on/off. |

Request `{ "enabled": false }` → 200 with updated profile snippet.

---

## 3. Authentication & Authorization

- **Method**: Supabase JWT in `Authorization` header.
- **RLS**: All DB tables have row-level security ensuring `user_id = auth.uid()` and `deleted = false` (measurements).
- **Anonymous requests**: 401.

Additional security:

- **Rate limiting**: 100 req / 1 min / user (API middleware).
- **HTTPS only**.
- **CORS**: allow frontend origin.

---

## 4. Validation & Business Logic

### 4.1 Profile

- `sex` enum validation.
- `weight` numeric > 0.
- Optional fields trimmed to 255 chars.

### 4.2 Measurement Rules

- `sys`, `dia`, `pulse` ranges: TBD safe limits (see PRD §3.10).
- `sys >= dia` (PRD US-012).
- Unique (user, measured_at).
- Logical delete; RLS hides `deleted=true` rows.

### 4.3 Interpretation Logic

- ESC/ESH 2023 classification performed server-side helper.
- Each interpretation persisted to `interpretation_logs` (immutable).
- Updating a measurement creates new log entry (history).

---

## 5. Error Handling

| HTTP | Meaning                                | Body Example                                     |
| ---- | -------------------------------------- | ------------------------------------------------ |
| 400  | Validation error                       | `{ "error": "pulse must be >= 30" }`             |
| 401  | Unauthorized                           | `{ "error": "invalid_token" }`                   |
| 403  | Forbidden (should not happen with RLS) | `{ "error": "forbidden" }`                       |
| 404  | Not found                              | `{ "error": "measurement not found" }`           |
| 409  | Conflict (duplicate)                   | `{ "error": "measurement at timestamp exists" }` |
| 429  | Rate limit                             | `{ "error": "too_many_requests" }`               |
| 500  | Server error                           | `{ "error": "internal_server_error" }`           |

---

## 6. Performance Considerations

- List endpoints use `idx_measurements_user_time_desc` covering index to serve default sort and projected columns without table look-up.
- Paging uses keyset pagination for large datasets: provide `cursor` param optionally.
- Interpretation batch export streams rows using PostgreSQL `COPY` in edge function to avoid memory pressure.
- Background cron (Supabase Edge Function) sends reminder e-mails at 08:00/20:00 respecting `reminder_enabled`.

---

## 7. Open Assumptions

1. Safe value ranges for validation (sys/dia/pulse) will be finalised later.
2. JWT provided by Supabase client SDK on frontend.
3. Server environment is Astro API routes (TypeScript) deployed on DigitalOcean.
4. Edge functions or scheduled jobs use service role key to bypass RLS when mailing.

---

## 8. Change Log

| Date       | Version | Notes                                  |
| ---------- | ------- | -------------------------------------- |
| 2025-11-07 | 0.1     | Initial draft created by AI assistant. |
