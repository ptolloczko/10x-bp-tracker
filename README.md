# BP Tracker

A lightweight web application that helps users manually record, interpret and export blood pressure measurements according to the 2023 European Society of Cardiology / European Society of Hypertension (ESC/ESH) guidelines.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

---

## Project Description

BP Tracker allows users to quickly add blood-pressure readings, receive an immediate guideline-based interpretation (normal / elevated / hypertension), view visual alerts, schedule e-mail reminders and export the full measurement history to CSV. All interpretations are stored for audit purposes and a basic authentication layer guarantees data privacy.

Key features:

- **Add measurements in seconds** – default timestamp, field validation & safety ranges.
- **Automatic interpretation** – green, orange or red classification using ESC/ESH 2023.
- **Visual alerts** – colour & icon indicators on the measurement list.
- **Edit / delete** – maintain clean and accurate records.
- **Reminder e-mails** – sent at 08:00 and 20:00 (opt-out available).
- **CSV export** – semicolon-separated UTF-8 for easy sharing with healthcare providers.

---

## Tech Stack

- **Frontend**: Astro 5, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, Shadcn/UI, Lucide-React icons
- **Backend-as-a-Service**: Supabase (PostgreSQL, Auth, Storage)
- **Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E/UI), Playwright-axe (accessibility)
- **Tooling**: ESlint, Prettier, Husky & lint-staged, Node `22.14.0`

---

## Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) `22.14.0` (run `nvm use` to match `.nvmrc`)
- npm v10 (shipped with Node) or an alternative package manager

### Installation

```bash
# 1. Clone the repository
$ git clone git@github.com:ptolloczko/10x-bp-tracker.git && cd 10x-bp-tracker

# 2. Install dependencies
$ npm install

# 3. Start the dev server
$ npm run dev
```

The app will be available at `http://localhost:4321` (Astro default).

### Building for Production

```bash
# Generate production build
$ npm run build

# Preview the production build locally
$ npm run preview
```

---

## Available Scripts

| Script             | Purpose                              |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start Astro in development mode      |
| `npm run build`    | Build the static production site     |
| `npm run preview`  | Preview the production build locally |
| `npm run lint`     | Run ESLint on the entire project     |
| `npm run lint:fix` | Autofix lint issues where possible   |
| `npm run format`   | Format the codebase with Prettier    |

### Testing Scripts

| Script                                 | Purpose                                     |
| -------------------------------------- | ------------------------------------------- |
| `./scripts/test-get-profile.sh`        | Test GET /api/profile endpoint              |
| `./scripts/test-post-measurement.sh`   | Test POST /api/measurements endpoint        |
| `./scripts/test-get-measurements.sh`   | Test GET /api/measurements endpoint         |
| `./scripts/test-put-measurement.sh`    | Test PUT /api/measurements/{id} endpoint    |
| `./scripts/test-delete-measurement.sh` | Test DELETE /api/measurements/{id} endpoint |
| `./scripts/test-bp-classification.sh`  | Test BP classification against ESC/ESH 2023 |
| `./scripts/cleanup-test-profile.sh`    | Clean up test profile data                  |

---

## API Documentation

### GET /api/measurements

Returns a paginated list of blood pressure measurements with optional filtering and sorting.

**Endpoint:** `GET /api/measurements`

**Query Parameters:**

| Parameter   | Type                        | Default | Description                                              |
| ----------- | --------------------------- | ------- | -------------------------------------------------------- |
| `page`      | number (≥1)                 | `1`     | Page number                                              |
| `page_size` | number (1-100)              | `20`    | Number of items per page                                 |
| `from`      | ISO 8601 datetime           | -       | Start of measured_at range (inclusive)                   |
| `to`        | ISO 8601 datetime           | -       | End of measured_at range (inclusive)                     |
| `level`     | bp_level or comma-separated | -       | Filter by BP level (e.g., `optimal` or `optimal,normal`) |
| `sort`      | `asc` \| `desc`             | `desc`  | Sort order by measured_at                                |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "sys": 120,
      "dia": 80,
      "pulse": 72,
      "level": "normal",
      "measured_at": "2024-11-09T08:30:00+00:00",
      "notes": "Morning measurement",
      "created_at": "2024-11-09T08:31:00+00:00",
      "updated_at": "2024-11-09T08:31:00+00:00"
    }
  ],
  "page": 1,
  "page_size": 20,
  "total": 42
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**

```json
{
  "error": "ValidationError",
  "details": {
    "fieldErrors": {
      "page": ["Numer strony musi być >= 1"]
    }
  }
}
```

**500 Internal Server Error:**

```json
{
  "error": "ServerError",
  "message": "An unexpected error occurred"
}
```

**Example Usage:**

```bash
# Get all measurements (default pagination)
curl http://localhost:3000/api/measurements

# Get page 2 with 10 items per page
curl "http://localhost:3000/api/measurements?page=2&page_size=10"

# Filter by BP level (hypertensive crisis)
curl "http://localhost:3000/api/measurements?level=hypertensive_crisis"

# Filter by multiple BP levels
curl "http://localhost:3000/api/measurements?level=optimal,normal"

# Filter by date range
curl "http://localhost:3000/api/measurements?from=2024-11-01T00:00:00Z&to=2024-11-09T23:59:59Z"

# Sort ascending (oldest first)
curl "http://localhost:3000/api/measurements?sort=asc"

# Combined filters
curl "http://localhost:3000/api/measurements?level=grade1,grade2&from=2024-11-01T00:00:00Z&sort=asc&page_size=5"
```

---

### PUT /api/measurements/{id}

Updates an existing blood pressure measurement. Re-validates values, re-computes classification, and logs a new interpretation entry.

**Endpoint:** `PUT /api/measurements/{id}`

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>` (authentication to be implemented)

**Request Body (all fields optional - partial update):**

```json
{
  "sys": 135, // Optional: Systolic BP (mmHg), integer > 0
  "dia": 90, // Optional: Diastolic BP (mmHg), integer > 0
  "pulse": 75, // Optional: Heart rate (bpm), integer > 0
  "measured_at": "2024-11-09T09:00:00Z", // Optional: ISO 8601 datetime, not in future
  "notes": "Updated after doctor visit" // Optional: Max 255 characters
}
```

**Business Rules:**

- If both `sys` and `dia` are provided in update, `sys` must be ≥ `dia`
- `measured_at` must be unique per user (no duplicate timestamps)
- `measured_at` cannot be in the future
- Empty body `{}` is valid (no changes)

**Response (200 OK):**

```json
{
  "id": "uuid",
  "sys": 135,
  "dia": 90,
  "pulse": 75,
  "level": "grade1",
  "measured_at": "2024-11-09T09:00:00Z",
  "notes": "Updated after doctor visit",
  "created_at": "2024-11-09T08:31:00Z",
  "updated_at": "2024-11-09T09:05:00Z"
}
```

**Error Responses:**

**400 Bad Request - Validation Error:**

```json
{
  "error": "ValidationError",
  "details": {
    "fieldErrors": {
      "sys": ["Ciśnienie skurczowe musi być większe lub równe rozkurczowemu"]
    }
  }
}
```

**400 Bad Request - Duplicate Timestamp:**

```json
{
  "error": "MeasurementDuplicate",
  "message": "Measurement already exists for given timestamp"
}
```

**404 Not Found:**

```json
{
  "error": "MeasurementNotFound",
  "message": "Measurement not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "ServerError",
  "message": "An unexpected error occurred"
}
```

**Example Usage:**

```bash
# Update sys value only (reclassification happens automatically)
curl -X PUT http://localhost:3000/api/measurements/UUID_HERE \
  -H "Content-Type: application/json" \
  -d '{"sys": 145}'

# Update multiple fields
curl -X PUT http://localhost:3000/api/measurements/UUID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "sys": 135,
    "dia": 88,
    "pulse": 76,
    "notes": "Updated after exercise"
  }'

# Update only notes
curl -X PUT http://localhost:3000/api/measurements/UUID_HERE \
  -H "Content-Type: application/json" \
  -d '{"notes": "Corrected measurement context"}'
```

---

### DELETE /api/measurements/{id}

Soft-deletes a measurement (sets `deleted=true`). The measurement is hidden from all list/get operations but remains in the database for audit purposes.

**Endpoint:** `DELETE /api/measurements/{id}`

**Request Headers:**

- `Authorization: Bearer <token>` (authentication to be implemented)

**Response (204 No Content):**

No response body.

**Error Responses:**

**404 Not Found:**

```json
{
  "error": "MeasurementNotFound",
  "message": "Measurement not found"
}
```

**500 Internal Server Error:**

```json
{
  "error": "ServerError",
  "message": "An unexpected error occurred"
}
```

**Example Usage:**

```bash
# Delete a measurement
curl -X DELETE http://localhost:3000/api/measurements/UUID_HERE

# Verify deletion (measurement should not appear in list)
curl http://localhost:3000/api/measurements
```

**Note:** Deleted measurements:

- Cannot be retrieved via GET
- Cannot be updated via PUT
- Will return 404 if you try to delete again
- Are permanently excluded from all queries (soft delete)

---

### POST /api/measurements

Creates a new blood pressure measurement with automatic ESC/ESH 2023 classification.

**Endpoint:** `POST /api/measurements`

**Request Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <token>` (authentication to be implemented)

**Request Body:**

```json
{
  "sys": 120, // Required: Systolic BP (mmHg), integer > 0
  "dia": 80, // Required: Diastolic BP (mmHg), integer > 0
  "pulse": 70, // Required: Heart rate (bpm), integer > 0
  "measured_at": "2024-11-09T08:30:00Z", // Required: ISO 8601 datetime, not in future
  "notes": "Morning measurement" // Optional: Max 255 characters
}
```

**Business Rules:**

- `sys` must be ≥ `dia` (systolic cannot be less than diastolic)
- `measured_at` must be unique per user (no duplicate timestamps)
- `measured_at` cannot be in the future

**Response (201 Created):**

```json
{
  "id": "uuid",
  "sys": 120,
  "dia": 80,
  "pulse": 70,
  "level": "normal",
  "measured_at": "2024-11-09T08:30:00Z",
  "notes": "Morning measurement",
  "created_at": "2024-11-09T08:31:00Z",
  "updated_at": "2024-11-09T08:31:00Z"
}
```

**Classification Levels (ESC/ESH 2023):**

| Level                 | Systolic (mmHg) | Diastolic (mmHg) | Description                               |
| --------------------- | --------------- | ---------------- | ----------------------------------------- |
| `optimal`             | < 120           | AND < 80         | Optimal blood pressure                    |
| `normal`              | 120-129         | OR 80-84         | Normal blood pressure                     |
| `high_normal`         | 130-139         | OR 85-89         | High-normal blood pressure                |
| `grade1`              | 140-159         | OR 90-99         | Grade 1 hypertension                      |
| `grade2`              | 160-179         | OR 100-109       | Grade 2 hypertension                      |
| `grade3`              | ≥ 180           | OR ≥ 110         | Grade 3 hypertension                      |
| `hypertensive_crisis` | ≥ 180           | AND ≥ 120        | Hypertensive crisis - seek immediate care |

**Error Responses:**

**400 Bad Request - Validation Error:**

```json
{
  "error": "ValidationError",
  "details": {
    "fieldErrors": {
      "sys": ["Ciśnienie skurczowe musi być większe lub równe rozkurczowemu"]
    }
  }
}
```

**400 Bad Request - Duplicate Timestamp:**

```json
{
  "error": "MeasurementDuplicate",
  "message": "Measurement already exists for given timestamp"
}
```

**500 Internal Server Error:**

```json
{
  "error": "ServerError",
  "message": "An unexpected error occurred"
}
```

**Example Usage:**

```bash
# Create a measurement
curl -X POST http://localhost:3000/api/measurements \
  -H "Content-Type: application/json" \
  -d '{
    "sys": 125,
    "dia": 82,
    "pulse": 72,
    "measured_at": "2024-11-09T08:30:00Z",
    "notes": "Morning measurement before breakfast"
  }'
```

---

## Project Scope

The MVP intentionally excludes the following:

- Sharing measurements between users
- Device integrations or mobile apps
- Multi-language support
- Data at-rest encryption, backups & disaster recovery
- Password reset / session auto-logout

Please refer to [`docs/PRD.md`](./.ai/prd.md) for the full product requirements.

---

## Project Status

Active MVP development – contributions & issues welcome!

---

## License

Released under the [MIT License](./LICENSE). Feel free to use, share and contribute.
