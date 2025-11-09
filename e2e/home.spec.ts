import { test, expect } from "../fixtures/test";
import { BasePage } from "../page-objects/BasePage";

/**
 * Example E2E test for home page
 * Run with: npm run test:e2e
 */
test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    const homePage = new BasePage(page);

    await homePage.goto("/");
    await homePage.waitForPageLoad();

    const title = await homePage.getTitle();
    expect(title).toBeTruthy();
  });

  test("should have navigation elements", async ({ page }) => {
    await page.goto("/");

    // Check if main content is visible
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("should be accessible", async ({ page }) => {
    await page.goto("/");

    // Basic accessibility checks
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang");
  });
});
