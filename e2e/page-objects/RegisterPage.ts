import { BasePage } from "./BasePage";

/**
 * Page Object Model for the Register page
 * Handles user registration flow
 */
export class RegisterPage extends BasePage {
  // URL path
  readonly path = "/register";

  // Locators using data-test-id
  get emailInput() {
    return this.page.getByTestId("register-email-input");
  }

  get passwordInput() {
    return this.page.getByTestId("register-password-input");
  }

  get confirmPasswordInput() {
    return this.page.getByTestId("register-confirm-password-input");
  }

  get submitButton() {
    return this.page.getByTestId("register-submit-button");
  }

  get errorMessage() {
    return this.page.getByTestId("register-error-message");
  }

  // Actions
  /**
   * Navigate to the register page
   */
  async navigate() {
    await this.goto(this.path);

    // Wait for page to fully load
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");

    // Wait for React to hydrate - the form should appear
    await this.emailInput.waitFor({ state: "visible" });
  }

  /**
   * Fill email input
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password input
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill confirm password input
   */
  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Complete registration flow
   * @param email - User email
   * @param password - User password
   */
  async register(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(password);
    await this.clickSubmit();
  }

  /**
   * Wait for successful registration and redirect
   */
  async waitForRedirectToMeasurements() {
    await this.page.waitForURL("**/measurements");
  }

  /**
   * Check if error message is visible
   */
  async hasError() {
    return await this.errorMessage.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorText() {
    return await this.errorMessage.textContent();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled() {
    return await this.submitButton.isDisabled();
  }
}
