import { test, expect } from "@playwright/test";
import { RegisterPage, MeasurementsPage, AddMeasurementDialog } from "./page-objects";

/**
 * E2E Test: User registration and adding first measurement
 * Tests the complete flow from registration to adding a blood pressure measurement
 */
test.describe("Register and Add First Measurement", () => {
  let registerPage: RegisterPage;
  let measurementsPage: MeasurementsPage;
  let addMeasurementDialog: AddMeasurementDialog;

  // Generate unique test email for each test run
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "Test123!@#";

  test.beforeEach(async ({ page }) => {
    // Initialize page objects
    registerPage = new RegisterPage(page);
    measurementsPage = new MeasurementsPage(page);
    addMeasurementDialog = new AddMeasurementDialog(page);
  });

  test("should register new user and add first measurement", async () => {
    // ============================================================
    // ARRANGE: Navigate to registration page
    // ============================================================
    await registerPage.navigate();

    // Verify we're on the registration page
    await expect(registerPage.page).toHaveURL(/.*register/);

    // ============================================================
    // ACT: Register new user
    // ============================================================
    await registerPage.register(testEmail, testPassword);

    // ============================================================
    // ASSERT: Verify redirect to measurements page
    // ============================================================
    await registerPage.waitForRedirectToMeasurements();
    await expect(measurementsPage.page).toHaveURL(/.*measurements/);

    // Wait for page to load completely
    await measurementsPage.page.waitForLoadState("networkidle");

    // Verify empty state is shown (no measurements yet)
    const isEmptyState = await measurementsPage.isEmptyState();
    expect(isEmptyState).toBe(true);

    // ============================================================
    // ACT: Open add measurement dialog
    // ============================================================
    await measurementsPage.clickAddMeasurement();

    // Wait for dialog to appear
    await addMeasurementDialog.waitForDialog();
    await expect(addMeasurementDialog.dialog).toBeVisible();

    // ============================================================
    // ACT: Fill measurement form
    // ============================================================
    const testMeasurement = {
      sys: 120,
      dia: 80,
      pulse: 70,
      notes: "First measurement after registration - E2E test",
    };

    await addMeasurementDialog.addMeasurement(testMeasurement);

    // ============================================================
    // ASSERT: Verify measurement was added
    // ============================================================
    // Wait for dialog to close
    await addMeasurementDialog.waitForClose();

    // Wait for success toast
    await measurementsPage.waitForToast("Pomiar został dodany");

    // Verify measurement appears in the table
    const hasTable = await measurementsPage.hasTable();
    expect(hasTable).toBe(true);

    // Verify measurement count
    const measurementCount = await measurementsPage.getMeasurementCount();
    expect(measurementCount).toBeGreaterThan(0);

    // Verify measurement data (first row)
    const measurementData = await measurementsPage.getMeasurementData(0);
    expect(measurementData.sys).toContain("120");
    expect(measurementData.dia).toContain("80");
    expect(measurementData.pulse).toContain("70");
    expect(measurementData.notes).toContain(testMeasurement.notes);
  });

  test("should show validation errors for invalid registration data", async () => {
    // ============================================================
    // ARRANGE: Navigate to registration page
    // ============================================================
    await registerPage.navigate();

    // ============================================================
    // ACT: Try to register with weak password
    // ============================================================
    const weakPassword = "weak";
    await registerPage.fillEmail(testEmail);
    await registerPage.fillPassword(weakPassword);
    await registerPage.fillConfirmPassword(weakPassword);
    await registerPage.clickSubmit();

    // ============================================================
    // ASSERT: Verify validation error is shown
    // ============================================================
    // Form should show validation errors (managed by react-hook-form)
    // User should still be on register page
    await expect(registerPage.page).toHaveURL(/.*register/);
  });

  test("should show validation errors for mismatched passwords", async () => {
    // ============================================================
    // ARRANGE: Navigate to registration page
    // ============================================================
    await registerPage.navigate();

    // ============================================================
    // ACT: Try to register with non-matching passwords
    // ============================================================
    await registerPage.fillEmail(testEmail);
    await registerPage.fillPassword(testPassword);
    await registerPage.fillConfirmPassword("DifferentPassword123!@#");
    await registerPage.clickSubmit();

    // ============================================================
    // ASSERT: Verify validation error is shown
    // ============================================================
    // User should still be on register page
    await expect(registerPage.page).toHaveURL(/.*register/);
  });
});
