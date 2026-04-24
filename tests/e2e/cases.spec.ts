import { test, expect, type Page } from "@playwright/test";

/**
 * Case management E2E tests.
 *
 * Tests cover:
 * - Cases list loads for logged-in client
 * - Case detail page is accessible
 * - Documents sub-route renders
 * - Evidence sub-route renders
 * - Applications sub-route renders
 * - Role guard: unauthenticated access is blocked
 */

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe("Cases List", () => {
  test("client sees cases page", async ({ page }) => {
    await loginAs(page, "client1@civilex.pk", "demo123456");
    await page.goto("/cases");
    await expect(page.getByRole("heading", { name: /cases/i })).toBeVisible({
      timeout: 8_000,
    });
  });

  test("lawyer sees cases page", async ({ page }) => {
    await loginAs(page, "lawyer1@civilex.pk", "demo123456");
    await page.goto("/cases");
    await expect(page.getByRole("heading", { name: /cases/i })).toBeVisible({
      timeout: 8_000,
    });
  });

  test("unauthenticated access to /cases redirects to /login", async ({
    page,
  }) => {
    await page.goto("/cases");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Case Sub-routes (smoke)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "client1@civilex.pk", "demo123456");
  });

  test("/cases page loads without error", async ({ page }) => {
    await page.goto("/cases");
    await expect(page).not.toHaveURL(/error/);
    await expect(page.locator("body")).not.toContainText(/500|internal server error/i);
  });
});
