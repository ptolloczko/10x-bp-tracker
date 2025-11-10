import type { Page } from "@playwright/test";

/**
 * Page Object Model for the Add Measurement Dialog
 * Handles adding new blood pressure measurements
 * Note: This is a component, not a full page, so it doesn't extend BasePage
 */
export class AddMeasurementDialog {
  constructor(private readonly page: Page) {}

  // Locators using data-test-id
  get dialog() {
    return this.page.getByTestId("add-measurement-dialog");
  }

  get dateTimeInput() {
    return this.page.getByTestId("measurement-datetime-input");
  }

  get sysInput() {
    return this.page.getByTestId("measurement-sys-input");
  }

  get diaInput() {
    return this.page.getByTestId("measurement-dia-input");
  }

  get pulseInput() {
    return this.page.getByTestId("measurement-pulse-input");
  }

  get notesInput() {
    return this.page.getByTestId("measurement-notes-input");
  }

  get submitButton() {
    return this.page.getByTestId("measurement-submit-button");
  }

  // Actions
  /**
   * Wait for dialog to be visible
   */
  async waitForDialog() {
    await this.dialog.waitFor({ state: "visible" });
  }

  /**
   * Check if dialog is visible
   */
  async isVisible() {
    return await this.dialog.isVisible();
  }

  /**
   * Fill date and time input
   * @param dateTime - Date string in format YYYY-MM-DDTHH:mm
   */
  async fillDateTime(dateTime: string) {
    await this.dateTimeInput.fill(dateTime);
  }

  /**
   * Fill systolic pressure (SYS)
   */
  async fillSys(value: number | string) {
    await this.sysInput.fill(value.toString());
  }

  /**
   * Fill diastolic pressure (DIA)
   */
  async fillDia(value: number | string) {
    await this.diaInput.fill(value.toString());
  }

  /**
   * Fill pulse
   */
  async fillPulse(value: number | string) {
    await this.pulseInput.fill(value.toString());
  }

  /**
   * Fill notes (optional)
   */
  async fillNotes(notes: string) {
    await this.notesInput.fill(notes);
  }

  /**
   * Click submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Complete the measurement form
   * @param data - Measurement data
   */
  async fillMeasurement(data: {
    dateTime?: string;
    sys: number;
    dia: number;
    pulse: number;
    notes?: string;
  }) {
    // Fill datetime if provided, otherwise use current datetime
    if (data.dateTime) {
      await this.fillDateTime(data.dateTime);
    }

    await this.fillSys(data.sys);
    await this.fillDia(data.dia);
    await this.fillPulse(data.pulse);

    if (data.notes) {
      await this.fillNotes(data.notes);
    }
  }

  /**
   * Fill form and submit
   */
  async addMeasurement(data: {
    dateTime?: string;
    sys: number;
    dia: number;
    pulse: number;
    notes?: string;
  }) {
    await this.fillMeasurement(data);
    await this.clickSubmit();
  }

  /**
   * Wait for dialog to close
   */
  async waitForClose() {
    await this.dialog.waitFor({ state: "hidden" });
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled() {
    return await this.submitButton.isDisabled();
  }

  /**
   * Get dialog title
   */
  async getTitle() {
    return await this.page.locator('[data-slot="dialog-title"]').textContent();
  }

  /**
   * Helper: Generate current datetime string in required format
   */
  static getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}

