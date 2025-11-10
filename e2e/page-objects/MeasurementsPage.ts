import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Measurements page
 * Handles measurements list, filtering, and navigation
 */
export class MeasurementsPage extends BasePage {
  // URL path
  readonly path = "/measurements";

  // Locators using data-test-id
  get addMeasurementButton() {
    return this.page.getByTestId("add-measurement-button");
  }

  get addFirstMeasurementButton() {
    return this.page.getByTestId("add-first-measurement-button");
  }

  // Actions
  /**
   * Navigate to the measurements page
   */
  async navigate() {
    await this.goto(this.path);
    // Wait for page to fully load and React to hydrate
    await this.page.waitForLoadState("load");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
    // Wait for React hydration
    await this.page.waitForSelector("h1", { state: "visible" });
  }

  /**
   * Click "Add Measurement" button
   */
  async clickAddMeasurement() {
    // Try to find the regular button first, fallback to "add first" button
    const regularButton = this.addMeasurementButton;
    const firstButton = this.addFirstMeasurementButton;

    if (await regularButton.isVisible().catch(() => false)) {
      await regularButton.click();
    } else if (await firstButton.isVisible().catch(() => false)) {
      await firstButton.click();
    } else {
      throw new Error("No add measurement button found");
    }
  }

  /**
   * Check if page is in empty state (no measurements)
   */
  async isEmptyState() {
    // Wait for loading to finish - check if loading spinner is gone
    await this.page.waitForSelector('[role="status"]', { state: "hidden", timeout: 10000 }).catch(() => {
      // If no loading spinner found, that's OK
    });

    // Now check for empty state button
    return await this.addFirstMeasurementButton.isVisible().catch(() => false);
  }

  /**
   * Get the heading text
   */
  async getHeading() {
    return await this.page.locator("h1").textContent();
  }

  /**
   * Check if measurements table is visible
   */
  async hasTable() {
    return await this.page.locator("table").isVisible();
  }

  /**
   * Get all measurement rows from the table
   */
  async getMeasurementRows() {
    return await this.page.locator("tbody tr").all();
  }

  /**
   * Get count of measurements in the table
   */
  async getMeasurementCount() {
    const rows = await this.getMeasurementRows();
    return rows.length;
  }

  /**
   * Get measurement data from a specific row
   * @param index - Row index (0-based)
   */
  async getMeasurementData(index: number) {
    const row = this.page.locator("tbody tr").nth(index);
    const cells = await row.locator("td").allTextContents();

    return {
      dateTime: cells[0],
      sys: cells[1],
      dia: cells[2],
      pulse: cells[3],
      level: cells[4],
      notes: cells[5],
    };
  }

  /**
   * Wait for toast notification with specific text
   * @param text - Expected toast text
   */
  async waitForToast(text: string) {
    await this.page.locator(`text=${text}`).waitFor({ state: "visible" });
  }

  /**
   * Check if success toast is visible
   */
  async hasSuccessToast() {
    return await this.page
      .locator('[data-type="success"]')
      .isVisible()
      .catch(() => false);
  }
}
