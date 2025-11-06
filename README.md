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
