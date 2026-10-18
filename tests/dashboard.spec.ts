import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
config({ path: ".env.dashboard-test", override: true, quiet: true });
const sql = neon(process.env.DATABASE_URL!);
const credentials = JSON.parse(readFileSync(".admin-test.json", "utf8"));
const run = randomUUID().slice(0, 8),
  title = `QA Everyday Mug ${run}`,
  email = `buyer-${run}@zylo-test.invalid`;
const address = {
  customerName: "QA Test Customer",
  email,
  phone: "9876543210",
  addressLine: "14 Test Street",
  city: "Ludhiana",
  state: "Punjab",
  pincode: "141001",
};
async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Owner email").fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Your store at a glance." }),
  ).toBeVisible();
}

test.beforeAll(async () => {
  const [db] = await sql`SELECT current_database() AS name`;
  if (!String(db.name).startsWith("zylo_dashboard_test_"))
    throw Error("Refusing to test a non-test database");
  await sql`DELETE FROM admin_login_attempts`;
});

test("owner routes and exports reject anonymous requests", async ({
  page,
  request,
}) => {
  await page.goto("/admin/products");
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect((await request.get("/api/admin/export?type=orders")).status()).toBe(
    401,
  );
  await page.getByLabel("Owner email").fill("nobody@zylo-test.invalid");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-password");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page.locator("p[role=alert]")).toContainText("incorrect");
});

test("product, upload, checkout, fulfillment, returns, customers and archive work end to end", async ({
  page,
  browser,
}) => {
  await login(page);
  await page.screenshot({
    path: "test-results/overview-desktop.png",
    fullPage: true,
  });
  await page.goto("/admin/products/new");
  await page.getByLabel("Product name", { exact: true }).fill(title);
  await page
    .getByLabel("Description", { exact: true })
    .fill("A durable ceramic mug made for everyday coffee and tea.");
  await page.getByLabel("Category", { exact: true }).fill("home-living");
  await page.getByLabel("SKU", { exact: true }).fill(`QA-${run}`);
  await page.getByLabel("Selling price (₹)", { exact: true }).fill("499");
  await page.getByLabel("Opening stock", { exact: true }).fill("5");
  await page
    .getByLabel("Or upload a cover image")
    .setInputFiles({
      name: "mug.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  await expect(page.getByLabel("Cover image", { exact: true })).toHaveValue(
    /\/media\//,
  );
  await page
    .getByRole("button", { name: "Create product", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/products\?saved=1/);
  const [product] = await sql`SELECT * FROM products WHERE sku=${`QA-${run}`}`;
  expect(product.stock).toBe(5);
  expect(Math.round(product.price * 84)).toBe(499);
  const publicProduct = await page.request.get(
    `/api/products?ids=${product.id}`,
  );
  expect((await publicProduct.json()).products).toHaveLength(1);
  expect((await page.request.get(product.thumbnail)).status()).toBe(200);
  await page.goto(`/product/${product.id}`);
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  // A real customer browser completes the storefront checkout, including cart persistence.
  const customer = await browser.newContext();
  const shop = await customer.newPage();
  await shop.goto(`/product/${product.id}`);
  await shop.getByRole("button", { name: /buy now/i }).click();
  await expect(shop).toHaveURL(/\/checkout$/);
  for (const [field, value] of Object.entries(address))
    await shop.locator(`[name="${field}"]`).fill(value);
  await shop.getByRole("button", { name: /Place order/ }).click();
  await expect(shop).toHaveURL(/\/order\/ZY-/);
  const reference = shop.url().split("/").pop()!;
  await expect(
    shop.getByRole("heading", { name: "Order confirmed", exact: true }),
  ).toBeVisible();
  const [order] = await sql`SELECT * FROM orders WHERE reference=${reference}`;
  expect(order.total_paise).toBe(49900);
  expect(order.request_key).toBeTruthy();
  let [stock] = await sql`SELECT stock FROM products WHERE id=${product.id}`;
  expect(stock.stock).toBe(4);
  const retry = await customer.request.post(
    "http://127.0.0.1:3100/api/orders",
    {
      data: {
        ...address,
        lines: [{ productId: product.id, qty: 1 }],
        requestKey: order.request_key,
      },
    },
  );
  expect(retry.status()).toBe(200);
  expect((await retry.json()).reference).toBe(reference);
  [stock] = await sql`SELECT stock FROM products WHERE id=${product.id}`;
  expect(stock.stock).toBe(4);
  const tampered = await customer.request.post(
    "http://127.0.0.1:3100/api/orders",
    {
      data: {
        ...address,
        lines: [{ productId: product.id, qty: 2 }],
        requestKey: order.request_key,
      },
    },
  );
  expect(tampered.status()).toBe(400);
  const visitor = await browser.newContext();
  const tracking = await visitor.newPage();
  await tracking.goto(`/order/${reference}`);
  await expect(tracking).toHaveURL(/\/track-order$/);
  await tracking.getByLabel("Order reference").fill(reference);
  await tracking
    .getByLabel("Email used at checkout")
    .fill("wrong@zylo-test.invalid");
  await tracking
    .getByRole("button", { name: "Track order", exact: true })
    .click();
  await expect(tracking.locator("p[role=alert]")).toContainText(
    "couldn’t find",
  );
  await tracking.getByLabel("Email used at checkout").fill(email);
  await tracking
    .getByRole("button", { name: "Track order", exact: true })
    .click();
  await expect(tracking).toHaveURL(new RegExp(`/order/${reference}$`));
  // Owner handles the entire fulfillment lifecycle.
  await page.goto(`/admin/orders/${order.id}`);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  for (const status of [
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "returned",
  ]) {
    await page.getByLabel("Fulfillment status").selectOption(status);
    if (status === "shipped") {
      await page.getByLabel("Courier / carrier").fill("QA Courier");
      await page.getByLabel("Tracking number", { exact: true }).fill("QA123");
      await page
        .getByLabel("Tracking URL", { exact: true })
        .fill("https://example.com/track/QA123");
    }
    if (status === "delivered")
      await page
        .getByLabel("Payment status", { exact: true })
        .selectOption("paid");
    if (status === "returned")
      await page
        .getByLabel("Payment status", { exact: true })
        .selectOption("refunded");
    await page.getByRole("button", { name: "Save order", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("Order updated");
    await expect
      .poll(async () => {
        const [o] = await sql`SELECT status FROM orders WHERE id=${order.id}`;
        return o.status;
      })
      .toBe(status);
    await expect(page.getByRole("button", {name:"Save order",exact:true})).toBeEnabled();
  }
  [stock] = await sql`SELECT stock FROM products WHERE id=${product.id}`;
  expect(stock.stock).toBe(5);
  await page.getByRole("button", { name: "Save order", exact: true }).click();
  await expect(page.getByRole("status")).toBeVisible();
  [stock] = await sql`SELECT stock FROM products WHERE id=${product.id}`;
  expect(stock.stock).toBe(5);
  const [customerOrder] = await sql`SELECT email,customer_name FROM orders WHERE id=${order.id}`;
  expect(customerOrder.email).toBe(email);
  expect(customerOrder.customer_name).toBe(address.customerName);
  await page.goto(`/admin/customers?q=${encodeURIComponent(run)}`);
  await page.getByRole("link", { name: new RegExp(email) }).click();
  await expect(
    page.getByRole("heading", { name: "QA Test Customer.", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(reference, { exact: true })).toBeVisible();
  await page.goto(`/admin/products?q=${run}`);
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("visibility updated");
  expect((await page.request.get(`/product/${product.id}`)).status()).toBe(404);
  expect(
    (await (await page.request.get(`/api/products?ids=${product.id}`)).json())
      .products,
  ).toHaveLength(0);
  await page.goto(`/admin/orders/${order.id}`);
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  const csv = await page.request.get("/api/admin/export?type=orders");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain(reference);
  for (const route of [
    "/admin/orders",
    "/admin/products",
    "/admin/inventory",
    "/admin/customers",
    "/admin/analytics",
    "/admin/settings",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByText("We couldn’t load this part")).toHaveCount(0);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/admin");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Dashboard" })
    .getByRole("link", { name: "Products", exact: true })
    .click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/products-mobile.png",
    fullPage: true,
  });
  await customer.close();
  await visitor.close();
});

test("concurrent last-item checkouts cannot oversell", async ({ request }) => {
  await sql`UPDATE products SET stock=1,active=true WHERE id=3`;
  const payload = {
    ...address,
    email: `race-${run}@zylo-test.invalid`,
    lines: [{ productId: 3, qty: 1 }],
  };
  const responses = await Promise.all([
    request.post("/api/orders", {
      data: { ...payload, requestKey: randomUUID() },
    }),
    request.post("/api/orders", {
      data: { ...payload, requestKey: randomUUID() },
    }),
  ]);
  expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
  const [stock] = await sql`SELECT stock FROM products WHERE id=3`;
  expect(stock.stock).toBe(0);
  const invalid = await request.post("/api/orders", {
    data: {
      ...payload,
      requestKey: randomUUID(),
      lines: [{ productId: 3, qty: 1.5 }],
    },
  });
  expect(invalid.status()).toBe(400);
});

test("inventory adjustments, checkout shipping rules and cancellation remain consistent",async({page,request})=>{
 await login(page);
 await sql`UPDATE products SET stock=3,active=true WHERE id=2`;
 await page.goto("/admin/inventory?q=Classic%20Watch");
 const row=page.getByRole("row").filter({hasText:"Classic Watch"});
 await row.getByLabel("Stock change").fill("7");await row.getByLabel("Reason",{exact:true}).fill("New shipment received");await row.getByRole("button",{name:"Update",exact:true}).click();await expect(row.getByRole("status")).toContainText("Stock updated");
 let [stock]=await sql`SELECT stock FROM products WHERE id=2`;expect(stock.stock).toBe(10);
 await row.getByLabel("Stock change").fill("-11");await row.getByLabel("Reason",{exact:true}).fill("Damaged items");await row.getByRole("button",{name:"Update",exact:true}).click();await expect(row.locator("p[role=alert]")).toContainText("cannot go below zero");
 [stock]=await sql`SELECT stock FROM products WHERE id=2`;expect(stock.stock).toBe(10);
 await page.goto("/admin/settings");await page.getByLabel("Support email",{exact:true}).fill("support@zylo-test.invalid");await page.getByLabel("Delivery charge (₹)",{exact:true}).fill("49");await page.getByLabel("Free delivery above (₹)",{exact:true}).fill("1000");await page.getByRole("button",{name:"Save store settings",exact:true}).click();await expect(page.getByRole("status")).toContainText("Store settings saved");
 const response=await request.post("/api/orders",{data:{...address,email:`cancel-${run}@zylo-test.invalid`,lines:[{productId:1,qty:1}],requestKey:randomUUID()}});expect(response.status()).toBe(200);const reference=(await response.json()).reference;
 const [order]=await sql`SELECT * FROM orders WHERE reference=${reference}`;expect(order.shipping_paise).toBe(4900);expect(order.total_paise).toBe(88900);
 const [before]=await sql`SELECT stock FROM products WHERE id=1`;
 await page.goto(`/admin/orders/${order.id}`);await page.getByLabel("Fulfillment status").selectOption("cancelled");await page.getByRole("button",{name:"Save order",exact:true}).click();await expect(page.getByRole("status")).toContainText("Order updated");
 [stock]=await sql`SELECT stock FROM products WHERE id=1`;expect(stock.stock).toBe(before.stock+1);
 await page.getByRole("button",{name:"Save order",exact:true}).click();await expect(page.getByRole("status")).toBeVisible();
 [stock]=await sql`SELECT stock FROM products WHERE id=1`;expect(stock.stock).toBe(before.stock+1);
 await page.goto("/admin/products/1");await page.getByLabel("Product name",{exact:true}).fill("Unsaved title should survive a conflict");await sql`UPDATE products SET version=version+1 WHERE id=1`;await page.getByRole("button",{name:"Save product",exact:true}).click();await expect(page.locator("p[role=alert]")).toContainText("another tab");await expect(page.getByLabel("Product name",{exact:true})).toHaveValue("Unsaved title should survive a conflict");
 await sql`UPDATE store_settings SET shipping_paise=0,free_shipping_above_paise=0 WHERE id=1`;
});

test("owner setup is single-use and password changes revoke previous sessions",async({page,browser})=>{
 const {createHash,randomBytes}=await import("node:crypto");
 const [original]=await sql`SELECT * FROM admin_users WHERE id=1`;
 const token=randomBytes(32).toString("hex"),hash=createHash("sha256").update(token).digest("hex"),password="Initial-QA-Password-2026",newPassword="Changed-QA-Password-2026";
 await sql`DELETE FROM admin_sessions`;
 await sql`UPDATE admin_users SET email=NULL,password_hash=NULL,setup_token_hash=${hash},setup_expires_at=now()+interval '1 hour' WHERE id=1`;
 const other=await browser.newContext();
 try{
   await page.goto(`/admin/setup?token=${token}`);
  await page.getByLabel("Owner email",{exact:true}).fill("new-owner@zylo-test.invalid");
  await page.getByLabel("Create password",{exact:true}).fill(password);
  await page.getByLabel("Confirm password",{exact:true}).fill(password);
  await page.getByRole("button",{name:"Create owner account",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Your store at a glance."})).toBeVisible();
   const second=await other.newPage();await second.goto(`/admin/setup?token=${token}`);
  await second.getByLabel("Owner email",{exact:true}).fill("attacker@zylo-test.invalid");await second.getByLabel("Create password",{exact:true}).fill(password);await second.getByLabel("Confirm password",{exact:true}).fill(password);await second.getByRole("button",{name:"Create owner account",exact:true}).click();await expect(second.locator("p[role=alert]")).toContainText("already been used");
  await second.goto("/admin/login");await second.getByLabel("Owner email",{exact:true}).fill("new-owner@zylo-test.invalid");await second.getByLabel("Password",{exact:true}).fill(password);await second.getByRole("button",{name:"Sign in to dashboard"}).click();await expect(second.getByRole("heading",{name:"Your store at a glance."})).toBeVisible();
  await page.goto("/admin/settings");await page.getByLabel("Current password",{exact:true}).fill(password);await page.getByLabel("New password",{exact:true}).fill(newPassword);await page.getByLabel("Confirm new password",{exact:true}).fill(newPassword);await page.getByRole("button",{name:"Change password",exact:true}).click();await expect(page.getByRole("status")).toContainText("Password changed");
  expect((await other.request.get("http://127.0.0.1:3100/api/admin/export?type=orders")).status()).toBe(401);
  expect((await page.request.get("/api/admin/export?type=orders")).status()).toBe(200);
 }finally{
  await other.close();
  await sql`UPDATE admin_users SET email=${original.email},password_hash=${original.password_hash},setup_token_hash=NULL,setup_expires_at=NULL WHERE id=1`;
  await sql`DELETE FROM admin_sessions`;
 }
});
