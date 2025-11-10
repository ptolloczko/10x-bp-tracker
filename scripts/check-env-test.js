#!/usr/bin/env node

/**
 * Script to check if .env.test file exists
 * Used before running E2E tests
 */

import { existsSync } from "fs";
import { resolve } from "path";

const envTestPath = resolve(process.cwd(), ".env.test");

if (!existsSync(envTestPath)) {
  console.error("\n❌ Error: .env.test file not found!\n");
  console.log("📝 Please create .env.test file:");
  console.log("   cp .env.test.example .env.test\n");
  console.log("📖 Then follow the setup instructions in e2e/README.md\n");
  process.exit(1);
}

console.log("✅ .env.test file found");
