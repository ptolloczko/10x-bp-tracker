#!/usr/bin/env node

/**
 * Script to check if .env.test file exists
 * Used before running E2E tests
 * Skips check in CI environment where env vars are set directly
 */

import { existsSync } from "fs";
import { resolve } from "path";

// Skip check in CI environment (GitHub Actions, GitLab CI, etc.)
if (process.env.CI) {
  console.log("✅ Running in CI environment - skipping .env.test file check");
  process.exit(0);
}

const envTestPath = resolve(process.cwd(), ".env.test");

if (!existsSync(envTestPath)) {
  console.error("\n❌ Error: .env.test file not found!\n");
  console.log("📝 Please create .env.test file:");
  console.log("   cp .env.test.example .env.test\n");
  console.log("📖 Then follow the setup instructions in e2e/README.md\n");
  process.exit(1);
}

console.log("✅ .env.test file found");
