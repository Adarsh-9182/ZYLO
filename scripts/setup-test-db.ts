import { config } from "dotenv";
config({ path: ".env.dashboard-test", quiet: true });
import { neon } from "@neondatabase/serverless";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const [info] = await sql`SELECT current_database() AS name`;
  if (!String(info.name).startsWith("zylo_dashboard_test_"))
    throw Error("Refusing to seed a non-test database");
  const [existing] =
    await sql`SELECT to_regclass('public.products') AS table_name`;
  if (!existing.table_name) {
    const ddl = (await readFile("drizzle/0000_pink_post.sql", "utf8"))
      .split(";")
      .map((s) => s.replaceAll("--> statement-breakpoint", "").trim())
      .filter(Boolean);
    await sql.transaction(ddl.map((q) => sql.query(q)));
    await sql`ALTER TABLE products ADD COLUMN house boolean NOT NULL DEFAULT false, ADD COLUMN creative jsonb`;
    const orders = await readFile("scripts/migrate-orders.ts", "utf8");
    for (const m of orders.matchAll(/await sql`([\s\S]*?)`;/g))
      await sql.query(m[1]);
  }
  const ddl = (await readFile("scripts/migrate-admin.sql", "utf8"))
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  await sql.transaction(ddl.map((q) => sql.query(q)));
  const password = randomBytes(20).toString("hex"),
    salt = randomBytes(16).toString("hex"),
    hash = salt + ":" + scryptSync(password, salt, 64).toString("hex");
  await sql`INSERT INTO admin_users(id,email,password_hash) VALUES(1,'owner@zylo-test.invalid',${hash}) ON CONFLICT(id) DO UPDATE SET email='owner@zylo-test.invalid',password_hash=${hash},setup_token_hash=NULL,setup_expires_at=NULL`;
  await writeFile(
    ".admin-test.json",
    JSON.stringify({ email: "owner@zylo-test.invalid", password }),
    { mode: 0o600 },
  );
  for (const [id, title, category, stock, price] of [
    [1, "Everyday Cotton Tee", "mens-shirts", 40, 10],
    [2, "Classic Watch", "mens-watches", 3, 20],
    [3, "Last Item Test", "smartphones", 1, 30],
  ] as const) {
    await sql`INSERT INTO products(id,title,description,category,price,stock,thumbnail,images,sku) VALUES(${id},${title},'A carefully made product for everyday use.',${category},${price},${stock},'/zylo-logo.jpeg',ARRAY['/zylo-logo.jpeg'],${`TEST-${id}`}) ON CONFLICT(id) DO NOTHING`;
  }
  console.log(
    "Isolated test database initialized. Test credentials saved privately.",
  );
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
