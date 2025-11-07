# BP Tracker – Database Schema (PostgreSQL)

## 1. Tables

### 1.1 users (managed by Supabase Auth Service)
Supabase provides and maintains this table. Only referenced here for completeness.

---

### 1.2 profiles
| Column            | Type        | Constraints                                  | Description                               |
|-------------------|-------------|----------------------------------------------|-------------------------------------------|
| user_id           | UUID        | PRIMARY KEY, REFERENCES users(id) ON DELETE CASCADE | One-to-one link to user account          |
| first_name        | TEXT        |                                              | Optional given name                       |
| last_name         | TEXT        |                                              | Optional family name                      |
| dob               | DATE        |                                              | Date of birth                             |
| sex               | TEXT        | CHECK (sex IN ('male','female','other'))     | Biological sex / self-identification      |
| weight            | NUMERIC(5,1)| CHECK (weight > 0)                           | Weight in kg                              |
| phone             | TEXT        |                                              | E.164 formatted phone number              |
| timezone          | TEXT        | NOT NULL DEFAULT 'UTC'                       | IANA timezone identifier                  |
| reminder_enabled  | BOOLEAN     | NOT NULL DEFAULT TRUE                        | Email reminder on/off                     |
| created_at        | TIMESTAMPTZ | NOT NULL DEFAULT now()                       | Row creation timestamp                    |
| updated_at        | TIMESTAMPTZ | NOT NULL DEFAULT now()                       | Last update (trigger-maintained)          |

---

### 1.3 measurements
| Column        | Type          | Constraints                                              | Description                                 |
|---------------|--------------|----------------------------------------------------------|---------------------------------------------|
| id            | UUID         | PRIMARY KEY DEFAULT gen_random_uuid()                    | Measurement identifier                      |
| user_id       | UUID         | REFERENCES users(id) ON DELETE CASCADE                   | Owner                                       |
| sys           | SMALLINT     | NOT NULL                                                 | Systolic BP (mm Hg)                         |
| dia           | SMALLINT     | NOT NULL                                                 | Diastolic BP (mm Hg)                        |
| pulse         | SMALLINT     | NOT NULL                                                 | Pulse rate (bpm)                            |
| measured_at   | TIMESTAMPTZ  | NOT NULL                                                 | Measurement timestamp (UTC)                 |
| level         | bp_level     | NOT NULL                                                 | Classification per ESC/ESH 2023             |
| notes         | TEXT         |                                                         | Optional user notes (≤255 chars validated app-side) |
| deleted       | BOOLEAN      | NOT NULL DEFAULT FALSE                                   | Logical delete flag                         |
| created_at    | TIMESTAMPTZ  | NOT NULL DEFAULT now()                                   | Insertion timestamp                         |
| updated_at    | TIMESTAMPTZ  | NOT NULL DEFAULT now()                                   | Update timestamp                            |

Constraints:
- UNIQUE (user_id, measured_at) – prevents duplicate entries per moment.

---

### 1.4 interpretation_logs
| Column         | Type          | Constraints                                              | Description                                                           |
|----------------|--------------|----------------------------------------------------------|-----------------------------------------------------------------------|
| id             | UUID         | PRIMARY KEY DEFAULT gen_random_uuid()                    | Log entry id                                                          |
| measurement_id | UUID         | REFERENCES measurements(id) ON DELETE CASCADE            | Source measurement                                                    |
| user_id        | UUID         | REFERENCES users(id) ON DELETE CASCADE                   | Redundant shortcut for RLS & indexing                                 |
| sys            | SMALLINT     | NOT NULL                                                 | Copied systolic value                                                 |
| dia            | SMALLINT     | NOT NULL                                                 | Copied diastolic value                                                |
| pulse          | SMALLINT     | NOT NULL                                                 | Copied pulse                                                          |
| level          | bp_level     | NOT NULL                                                 | Resulting level                                                       |
| notes          | TEXT         |                                                         | Copied notes                                                          |
| created_at     | TIMESTAMPTZ  | NOT NULL DEFAULT now()                                   | Log creation time                                                     |

---

### 1.5 Enum Type `bp_level`
```sql
CREATE TYPE bp_level AS ENUM (
  'optimal',
  'normal',
  'high_normal',
  'grade1',
  'grade2',
  'grade3',
  'hypertensive_crisis'
);
```

## 2. Relationships
1. users 1--1 profiles (shared primary key `user_id`).
2. users 1--∞ measurements (`users.id` → `measurements.user_id`).
3. measurements 1--∞ interpretation_logs (`measurements.id` → `interpretation_logs.measurement_id`).
4. users 1--∞ interpretation_logs through `user_id` redundancy.

## 3. Indexes
```sql
-- Profiles
CREATE INDEX idx_profiles_last_name ON profiles(last_name);

-- Measurements
CREATE UNIQUE INDEX idx_measurements_user_time ON measurements(user_id, measured_at);
CREATE INDEX idx_measurements_user_time_desc ON measurements(user_id, measured_at DESC) INCLUDE(level, sys, dia, pulse) WHERE deleted = FALSE;

-- Interpretation logs
CREATE INDEX idx_logs_measurement ON interpretation_logs(measurement_id);
CREATE INDEX idx_logs_user_created_desc ON interpretation_logs(user_id, created_at DESC);
```

## 4. Row-Level Security (RLS)
Enable RLS on each user-owned table and apply owner-based policy with deleted filtering.
```sql
-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY profiles_modify ON profiles
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- MEASUREMENTS
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY measurements_select ON measurements
  FOR SELECT USING (user_id = auth.uid() AND deleted = FALSE);
CREATE POLICY measurements_modify ON measurements
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- INTERPRETATION LOGS
ALTER TABLE interpretation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_select ON interpretation_logs
  FOR SELECT USING (user_id = auth.uid());
```

Service-role connections (e.g., background jobs) may bypass RLS via Supabase service key.

## 5. Additional Notes
- `deleted = TRUE` rows remain for audit but are hidden from regular queries via RLS; consider periodic archival.
- Application layer validates input ranges and note length; database keeps schema lightweight.
- Triggers should maintain `updated_at` on `profiles` and `measurements`.
- Future scaling: partition `measurements` & `interpretation_logs` by month when row counts grow.
- Weight stored with single decimal; adjust precision if needed.
