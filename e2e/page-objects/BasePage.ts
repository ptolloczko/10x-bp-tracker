import type { Page } from "@playwright/test";

/**
 * Base page class with common methods and utilities
 * All page objects should extend this class
 */
export class BasePage {
  constructor(public readonly page: Page) {}

  /**
   * Navigate to a specific path
   */
  async goto(path: string) {
    await this.page.goto(path);
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string) {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Click on element
   */
  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  /**
   * Fill input field
   */
  async fill(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Get text content of element
   */
  async getText(selector: string) {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Wait for selector to be visible
   */
  async waitForSelector(selector: string) {
    await this.page.waitForSelector(selector);
  }

  /**
   * Take screenshot
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
