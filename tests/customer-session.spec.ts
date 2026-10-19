import { test, expect } from "@playwright/test";
import { config, parse } from "dotenv";
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

test("managed customer signup, login, order ownership, logout and Google redirect", async ({
  page,
  browser,
  baseURL,
}) => {
  test.skip(
    process.env.RUN_MANAGED_AUTH_TESTS !== "1",
    "Opt in to creating and removing a temporary account in the configured managed auth service.",
  );
  expect(baseURL).toBe("http://localhost:3000");
  config({ path: ".env.dashboard-test", override: true, quiet: true });
  const sql = neon(process.env.DATABASE_URL!);
  const [database] = await sql`SELECT current_database() AS name`;
  if (!String(database.name).startsWith("zylo_dashboard_test_"))
    throw Error("Refusing to use a non-test order database");
  const run = randomUUID().slice(0, 12),
    email = `qa-customer-${run}@zylo-test.invalid`,
    password = `Test-${randomUUID()}!`;
  const address = {
    customerName: "Customer QA",
    email,
    phone: "9876543210",
    addressLine: "14 Test Street",
    city: "Ludhiana",
    state: "Punjab",
    pincode: "141001",
  };
  const authEnvironment = parse(readFileSync(".env.local"));
  const authSql = neon(authEnvironment.DATABASE_URL);
  let createdId = "";
  const google = await browser.newContext();
  try {
    // This guest order must not become visible merely because an unverified account claims its email.
    await sql`UPDATE products SET stock=greatest(stock,10),active=true WHERE id=1`;
    const guest = await page.request.post("/api/orders", {
      data: {
        ...address,
        requestKey: randomUUID(),
        lines: [{ productId: 1, qty: 1 }],
      },
    });
    expect(guest.status()).toBe(200);
    const guestReference = (await guest.json()).reference;
    await page.goto("/signup");
    await page.getByLabel("Full name", { exact: true }).fill("Customer QA");
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password", { exact: true }).fill(password);
    const signup = page.waitForResponse(
      (r) =>
        r.url().includes("/api/auth/sign-up/email") &&
        r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    const signupResponse = await signup;
    expect(signupResponse.status()).toBe(200);
    const signupData = await signupResponse.json();
    createdId = signupData.user.id;
    expect(
      signupData.token,
      "Managed Auth should issue a session, or email verification needs a real test mailbox",
    ).toBeTruthy();
    await expect(page).toHaveURL(/\/account$/);
    await expect(
      page.getByRole("heading", { name: "Hello, Customer", exact: true }),
    ).toBeVisible();
    await expect(page.getByText(guestReference, { exact: true })).toHaveCount(
      0,
    );
    const denied = await page.request.get("/api/admin/export?type=orders");
    expect(denied.status()).toBe(401);
    await page.goto("/product/1");
    await page.getByRole("button", { name: /buy now/i }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByLabel("Full name", { exact: true })).toHaveValue(
      "Customer QA",
    );
    await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
    for (const [field, value] of Object.entries(address))
      await page.locator(`[name="${field}"]`).fill(value);
    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page).toHaveURL(/\/order\/ZY-/);
    const reference = page.url().split("/").pop()!;
    const [owned] =
      await sql`SELECT customer_id FROM orders WHERE reference=${reference}`;
    expect(owned.customer_id).toBe(signupData.user.id);
    await page.goto("/account");
    await expect(page.getByText(reference, { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Email", { exact: true }).fill(email);
    await page
      .getByLabel("Password", { exact: true })
      .fill("Incorrect-password-2026");
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page.locator("p[role=alert]")).toContainText(
      /invalid|incorrect/i,
    );
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Login", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await page.context().clearCookies({ name: /^zylo_order_/ });
    await page.getByRole("link", { name: "View order", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/order/${reference}$`));
    const other = await google.newPage();
    await other.goto(`${baseURL}/login`);
    await other
      .getByRole("button", { name: "Continue with Google", exact: true })
      .click();
    await expect(other).toHaveURL(
      /https:\/\/(accounts\.google\.com|www\.google\.com)\//,
      { timeout: 30000 },
    );
    await page.goto("/forgot-password");
    await page
      .getByLabel("Email", { exact: true })
      .fill(`unknown-${run}@zylo-test.invalid`);
    await page
      .getByRole("button", { name: "Send reset link", exact: true })
      .click();
    await expect(page.locator("p[role=status]")).toContainText(
      "If there’s an account",
    );
  } finally {
    await google.close();
    if (createdId) {
      // Managed Neon Auth does not expose Better Auth's self-delete endpoint.
      // Scope cleanup to the exact random ID + synthetic email created by this test.
      if (
        !email.startsWith("qa-customer-") ||
        !email.endsWith("@zylo-test.invalid")
      )
        throw Error("Unexpected cleanup identity");
      const deleted =
        await authSql`DELETE FROM neon_auth."user" WHERE id=${createdId} AND email=${email} RETURNING id`;
      expect(
        deleted.length,
        "Temporary managed auth account must be removed",
      ).toBe(1);
    }
  }
});
