import { test as base } from "@playwright/test";

/**
 * Extended test with custom fixtures
 * Use this for creating test-specific utilities and data
 */
export const test = base.extend({
  // Add your custom fixtures here
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   // Setup: Login the user
  //   await page.goto('/login');
  //   await page.fill('[name="email"]', 'test@example.com');
  //   await page.fill('[name="password"]', 'password123');
  //   await page.click('button[type="submit"]');
  //   await page.waitForURL('/dashboard');
  //
  //   // Use the authenticated page in tests
  //   await use(page);
  //
  //   // Cleanup: Logout
  //   await page.click('[data-testid="logout"]');
  // },
});

export { expect } from "@playwright/test";
