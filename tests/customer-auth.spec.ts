import { test, expect } from "@playwright/test";

test("customer login matches the reference, preserves navigation and works on mobile", async ({
  page,
}) => {
  await page.goto("/login?next=%2Fcheckout");
  await expect(
    page.getByRole("heading", { name: "Welcome back", exact: true }),
  ).toBeVisible();
  await expect(page.locator("header")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Login", exact: true }),
  ).toBeEnabled();
  await page
    .getByLabel("Email", { exact: true })
    .fill("qa-login@zylo-test.invalid");
  await page.getByLabel("Password", { exact: true }).fill("Test-password-2026");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page
    .getByRole("button", { name: "Hide password", exact: true })
    .click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.screenshot({
    path: "test-results/customer-login-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Don't have an account? Sign up", exact: true })
    .click();
  await expect(page).toHaveURL(/\/signup\?next=%2Fcheckout$/);
  await page.getByLabel("Full name", { exact: true }).fill("Test Customer");
  await page
    .getByLabel("Email", { exact: true })
    .fill("qa-login@zylo-test.invalid");
  await page.getByLabel("Password", { exact: true }).fill("Test-password-2026");
  await page
    .getByLabel("Confirm password", { exact: true })
    .fill("Other-password-2026");
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page.locator("p[role=alert]")).toContainText("don’t match");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Continue with Google", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/customer-login-mobile.png",
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Forgot password?", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Forgot your password?", exact: true }),
  ).toBeVisible();
  await page.goto("/reset-password");
  await expect(page.locator("p[role=alert]")).toContainText(
    "invalid or expired",
  );
  await expect(
    page.getByRole("button", { name: "Reset password", exact: true }),
  ).toBeDisabled();
});
