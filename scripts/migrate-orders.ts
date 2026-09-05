import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

/** Additive and idempotent — safe to re-run. */
async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      reference varchar(16) NOT NULL UNIQUE,
      customer_name varchar(120) NOT NULL,
      email varchar(200) NOT NULL,
      phone varchar(20) NOT NULL,
      address_line text NOT NULL,
      city varchar(80) NOT NULL,
      state varchar(80) NOT NULL,
      pincode varchar(10) NOT NULL,
      subtotal_paise integer NOT NULL,
      shipping_paise integer NOT NULL DEFAULT 0,
      total_paise integer NOT NULL,
      payment_method varchar(20) NOT NULL DEFAULT 'cod',
      status varchar(20) NOT NULL DEFAULT 'placed',
      placed_at timestamp NOT NULL DEFAULT now()
    )`;
  await sql`CREATE INDEX IF NOT EXISTS orders_reference_idx ON orders (reference)`;
  await sql`
    CREATE TABLE IF NOT EXISTS order_items (
      id serial PRIMARY KEY,
      order_id integer NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id integer NOT NULL,
      title varchar(256) NOT NULL,
      thumbnail text NOT NULL,
      unit_paise integer NOT NULL,
      qty integer NOT NULL
    )`;
  await sql`CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id)`;
  console.log("orders + order_items ready");
}
main().catch((e) => { console.error(e); process.exit(1); });
