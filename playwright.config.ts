import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * Playwright configuration for E2E tests
 * Initialized with Chromium/Desktop Chrome only as per guidelines
 */
export default defineConfig({
  testDir: "./e2e",

  // Global teardown to clean up test data from Supabase
  globalTeardown: "./e2e/global-teardown.ts",

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [["html"], ["list"]],

  // Global timeout for each test
  timeout: 60000, // 60 seconds per test

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Configure test id attribute (we use data-test-id with dash)
    testIdAttribute: "data-test-id",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Screenshot on failure
    screenshot: "only-on-failure",

    // Video on failure
    video: "retain-on-failure",

    // Navigation timeout
    navigationTimeout: 30000, // 30 seconds for page loads

    // Action timeout
    actionTimeout: 15000, // 15 seconds for actions
  },

  // Expect timeout
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },

  // Configure projects for major browsers
  // Only Chromium/Desktop Chrome as per guidelines
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe",
    timeout: 120000, // 2 minutes to allow Supabase to start if needed
  },
});
