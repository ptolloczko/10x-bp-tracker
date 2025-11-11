# BP Tracker

A lightweight web application that helps users manually record, interpret and export blood pressure measurements according to the 2023 European Society of Cardiology / European Society of Hypertension (ESC/ESH) guidelines.

---

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [API Documentation](#api-documentation)
6. [Deployment to Cloudflare Pages](#deployment-to-cloudflare-pages)
7. [Deployment & Hosting Analysis](#deployment--hosting-analysis)
8. [Project Scope](#project-scope)
9. [Project Status](#project-status)
10. [License](#license)

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
- **Deployment**: Cloudflare Pages with GitHub Actions CI/CD
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

## Deployment to Cloudflare Pages

This project is configured to deploy to Cloudflare Pages using GitHub Actions.

### Prerequisites

1. A Cloudflare account with a Pages project created
2. GitHub repository with the following secrets configured:

### Required GitHub Secrets

Secrets should be configured in **two locations**:

#### 1. Environment Secrets (for deployment) - `production` environment

Go to: `Settings > Environments > production > Environment secrets`

| Secret Name               | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`    | API token from Cloudflare with Pages write permissions (see instructions below) |
| `CLOUDFLARE_ACCOUNT_ID`   | Your Cloudflare account ID (found in Cloudflare Dashboard)                      |
| `CLOUDFLARE_PROJECT_NAME` | The name of your Cloudflare Pages project                                       |
| `PUBLIC_SUPABASE_URL`     | Your Supabase project URL (public) - used during build                          |
| `PUBLIC_SUPABASE_KEY`     | Your Supabase anon key (public) - used during build                             |

#### 2. Repository Secrets (for tests)

Go to: `Settings > Secrets and variables > Actions > Repository secrets`

| Secret Name          | Description                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| `SUPABASE_URL`       | Your Supabase project URL (for server-side API in unit tests)                  |
| `SUPABASE_KEY`       | Your Supabase service role key (for server-side API with elevated permissions) |
| `OPENROUTER_API_KEY` | OpenRouter API key (if using AI features in tests)                             |

> **Note**: The `deploy` job uses the `production` environment, so it accesses secrets from there. The `unit-tests` job doesn't use an environment, so it needs repository-level secrets.

#### 🔑 How to Create Cloudflare API Token

The **Authentication Error [code: 10001]** means your API token is missing or invalid. Follow these steps:

1. **Log in to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Navigate to API Tokens**:
   - Click your profile icon (top right)
   - Select "My Profile"
   - Click "API Tokens" tab
3. **Create Token**: Click "Create Token" button
4. **Configure Permissions** (choose one method):

   **Method A - Use Template (Recommended):**
   - Find "Edit Cloudflare Workers" template
   - Click "Use template"
   - Ensure it includes: **Account → Cloudflare Pages → Edit**

   **Method B - Custom Token:**
   - Click "Create Custom Token"
   - Add permission: **Account → Cloudflare Pages → Edit**
   - (Optional) Add: **Account → Account Settings → Read**

5. **Select Account Resources**:
   - Choose "All accounts" OR select specific account
6. **Create and Copy Token**:
   - Click "Continue to summary"
   - Click "Create Token"
   - **⚠️ COPY THE TOKEN IMMEDIATELY** (shown only once!)
7. **Add to GitHub Secrets**:
   - Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - Click "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: paste the copied token
   - Click "Add secret"

#### 🆔 How to Find Cloudflare Account ID

1. Log in to Cloudflare Dashboard: https://dash.cloudflare.com
2. Go to **Workers & Pages** (left sidebar)
3. Find **Account ID** in the right sidebar
4. Or check the URL: `dash.cloudflare.com/[ACCOUNT_ID]/workers-and-pages`
5. **Add to GitHub Secrets**: Name: `CLOUDFLARE_ACCOUNT_ID`, Value: your account ID

### Deployment Workflow

The project uses two CI/CD workflows:

1. **Pull Request Workflow** (`.github/workflows/pull-request.yml`)
   - Runs on every pull request to `master`
   - Executes linting, unit tests, and E2E tests
   - Posts a status comment on successful completion

2. **Master Workflow** (`.github/workflows/master.yml`)
   - Runs on every push to `master` branch
   - Executes linting and unit tests (no E2E tests for faster deployment)
   - Automatically deploys to Cloudflare Pages on success

### Manual Deployment

To deploy manually from your local machine:

```bash
# 1. Build the project
npm run build

# 2. Deploy using Wrangler CLI (requires Cloudflare login)
npx wrangler pages deploy dist --project-name=your-project-name
```

### Environment Variables in Cloudflare

**IMPORTANT**: Cloudflare Pages needs environment variables configured for **both** build-time AND runtime.

#### Configure in Cloudflare Dashboard:

1. Go to `Workers & Pages > your-project > Settings > Environment variables`
2. Select **Production** environment
3. Add these variables (they're already set during build via GitHub Actions, but needed here for consistency):
   - `PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `PUBLIC_SUPABASE_KEY` = your Supabase anon key
   - `PUBLIC_ENV_NAME` = `production` (must match exactly!)

> **Why this matters**: Variables prefixed with `PUBLIC_` are inlined during build by Astro, but Cloudflare also needs them configured to avoid hydration mismatches. The values must be **identical** to what's set in GitHub Actions during build.

### Troubleshooting Deployment Issues

#### ❌ Error: "Unable to authenticate request [code: 10001]"

**Cause**: Invalid or missing Cloudflare API token.

**Solutions**:

1. ✅ Verify `CLOUDFLARE_API_TOKEN` is set in **Environment secrets** for `production`:
   - Go to: `Settings > Environments > production > Environment secrets`
   - Ensure `CLOUDFLARE_API_TOKEN` exists and is not empty
2. ✅ Ensure the token has **Cloudflare Pages - Edit** permission
3. ✅ Create a new token if the current one expired or is invalid (see instructions above)
4. ✅ Check that you copied the entire token without extra spaces or newlines
5. ✅ Verify the environment name in workflow matches: `environment: production`

#### ❌ Error: "Project not found"

**Cause**: The Cloudflare Pages project doesn't exist or the name is incorrect.

**Solutions**:

1. ✅ Create a Pages project in Cloudflare Dashboard first (Workers & Pages → Create → Pages)
2. ✅ Verify `CLOUDFLARE_PROJECT_NAME` in environment `production` matches exactly (case-sensitive)
3. ✅ Check `CLOUDFLARE_ACCOUNT_ID` in environment `production` is correct
4. ✅ Ensure both secrets are set in: `Settings > Environments > production > Environment secrets`

#### ❌ Error: "Account ID mismatch"

**Cause**: The API token belongs to a different account.

**Solutions**:

1. ✅ Verify `CLOUDFLARE_ACCOUNT_ID` in environment `production` matches your account (see instructions above)
2. ✅ Ensure the `CLOUDFLARE_API_TOKEN` has access to this specific account
3. ✅ If using multiple Cloudflare accounts, ensure you're using the correct token and account ID pair
4. ✅ Both must be set in: `Settings > Environments > production > Environment secrets`

#### ❌ Build succeeds but deployment fails

**Solutions**:

1. ✅ Check that `dist/` folder exists after build
2. ✅ Verify `npm run build` works locally
3. ✅ Check GitHub Actions logs for specific error messages
4. ✅ Ensure all required dependencies are in `dependencies` (not just `devDependencies`)

#### ❌ React Error #418 / Hydration Mismatch in Production

**Error in console**: `Uncaught Error: Minified React error #418`

**Cause**: HTML generated on the server doesn't match what React renders on the client. Usually caused by missing or mismatched environment variables.

**Solutions**:

1. ✅ **Configure `PUBLIC_ENV_NAME` in Cloudflare Dashboard**:
   - Go to: `Workers & Pages > your-project > Settings > Environment variables`
   - Select **Production** environment
   - Add: `PUBLIC_ENV_NAME` = `production` (exactly as shown!)

2. ✅ **Verify all PUBLIC\_\* variables match between GitHub Actions and Cloudflare**:
   - GitHub Actions (build-time): set in `env:` section of `deploy` job
   - Cloudflare (runtime): set in Dashboard under Environment variables
   - Values must be **identical**

3. ✅ **Check variable names match exactly**:
   - It's `production` not `prod` (check `src/features/flags.ts`)
   - Variable names are case-sensitive

4. ✅ **Rebuild and redeploy** after setting environment variables:
   - Push a new commit to trigger rebuild
   - Or manually redeploy from Cloudflare Dashboard

5. ✅ **Clear browser cache and hard reload** (Ctrl+F5 or Cmd+Shift+R)

> **Technical explanation**: Astro inlines `PUBLIC_*` variables during build. If these variables differ between build-time (GitHub Actions) and runtime (Cloudflare), it causes hydration errors because the server-rendered HTML uses build-time values while React on the client tries to use runtime values.

---

## Deployment & Hosting Analysis

A detailed analysis was conducted to recommend hosting solutions for this web application, considering its potential growth from a side project into a commercial product. The primary requirement is a platform that can run a Node.js server for Astro's server-side rendering (SSR) capabilities.

### Recommended Platforms

| Platform             | Score | Summary                                                                                                                                                                 |
| -------------------- | :---: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloudflare Pages** | 10/10 | **Top Recommendation.** Ideal for a growing project. Offers a world-class free tier for commercial use, outstanding edge performance, and predictable low-cost scaling. |
| **Netlify**          | 9/10  | A very strong and safe choice with a great developer experience and a commercially friendly free tier. A solid starting point for any project.                          |
| **Vercel**           | 8/10  | Fantastic developer experience, but its free "Hobby" plan strictly forbids commercial use, making it a risky choice for a potential startup.                            |

### Alternative Platforms

| Platform                      | Score | Summary                                                                                                                                                                           |
| ----------------------------- | :---: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Render**                    | 8/10  | A great balance between ease-of-use and control. The lack of a free, always-on tier for server components is its main drawback for a pre-revenue project.                         |
| **DigitalOcean App Platform** | 7/10  | Powerful and cost-effective, but the higher complexity and DevOps overhead make it less ideal for a small team focused on rapid development. Best for when you need more control. |

### Detailed Critique

<details>
<summary>Click to expand for a detailed critique of each platform</summary>

#### 1. Main Framework Analysis

The main framework is Astro, which operates on a flexible model. It can generate static HTML files or run as a server-side rendered (SSR) application using a Node.js environment. Given the use of a Supabase backend and the potential for commercial growth, the application will require SSR for dynamic routes and user authentication. Therefore, the hosting solution must support a long-running Node.js process.

#### 2. Recommended Hosting Services (from Astro Core Team)

1.  **Vercel**: A serverless platform with deep integration for modern web frameworks.
2.  **Netlify**: A leading platform for building and deploying web applications with a focus on Jamstack architecture.
3.  **Cloudflare Pages**: A platform that leverages Cloudflare's global edge network for high-performance hosting and serverless functions.

#### 3. Alternative Platforms

1.  **DigitalOcean App Platform**: A Platform-as-a-Service (PaaS) that simplifies running applications on DigitalOcean's infrastructure, with support for Node.js and Docker containers.
2.  **Render**: A unified cloud platform to build and run apps and websites, offering a Heroku-like developer experience with support for Node.js services and Docker containers.

#### 4. Critique of Solutions

**a) Vercel**

- **Deployment**: Extremely simple. Connect a Git repository, and it deploys on every push.
- **Compatibility**: Perfect. Seamless support for Astro SSR via Vercel Functions.
- **Environments**: Excellent. Every pull request automatically gets its own preview deployment.
- **Plans**: `Hobby` plan is generous but strictly **non-commercial**. `Pro` plan at $20/user/month plus usage-based billing can become expensive.

**b) Netlify**

- **Deployment**: Very simple, mirrors the Vercel experience.
- **Compatibility**: Excellent. Full support for Astro's SSR via Netlify Functions.
- **Environments**: Excellent. Provides "Deploy Previews" for pull requests.
- **Plans**: Free tier is solid and **allows commercial use**, but has limits on build minutes (300/month). Paid plans start at $19/user/month.

**c) Cloudflare Pages**

- **Deployment**: Simple Git-based workflow.
- **Compatibility**: Excellent. Astro SSR is handled via Cloudflare Workers, offering superior performance.
- **Environments**: Excellent. Offers unlimited, free preview deployments.
- **Plans**: The free plan is the most generous, **allows commercial use**, and has high limits. The paid plan is a predictable flat $20/month for even higher limits.

**d) DigitalOcean App Platform**

- **Deployment**: More complex, requiring more explicit configuration of the app spec.
- **Compatibility**: High. Full control over the Node.js environment.
- **Environments**: Possible, but requires manual setup of multiple "apps".
- **Plans**: Pricing is resource-based and predictable (starts at $5/month). No free tier for server-based applications.

**e) Render**

- **Deployment**: Simple Git-based workflow.
- **Compatibility**: High. Natively supports Node.js and Docker containers.
- **Environments**: Good. "Pull Request Previews" are a feature on paid plans.
- **Plans**: Free tier for services **spins down after 15 minutes of inactivity**. The lowest-tier paid plan ($7/month) is required for an always-on service.

</details>

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
