import { test, expect } from "@playwright/test";

/**
 * Authentication flow E2E tests.
 *
 * Tests cover:
 * - Unauthenticated redirect to /login
 * - Login with valid credentials
 * - Login with invalid credentials (error message)
 * - Role-based post-login redirect to /dashboard
 * - Logout flow
 */

const DEMO_CLIENT = {
  email: "client1@civilex.pk",
  password: "demo123456",
};

const DEMO_LAWYER = {
  email: "lawyer1@civilex.pk",
  password: "demo123456",
};

test.describe("Authentication", () => {
  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({
      timeout: 8_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test("client can log in and reaches /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(DEMO_CLIENT.email);
    await page.getByLabel(/password/i).fill(DEMO_CLIENT.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("lawyer can log in and reaches /dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(DEMO_LAWYER.email);
    await page.getByLabel(/password/i).fill(DEMO_LAWYER.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test("logged-in user can log out", async ({ page }) => {
    // Log in first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(DEMO_CLIENT.email);
    await page.getByLabel(/password/i).fill(DEMO_CLIENT.password);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Log out via sidebar/topbar button
    await page.getByRole("button", { name: /log out|sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });
});
