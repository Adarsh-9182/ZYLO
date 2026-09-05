import "server-only";
import { randomInt } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { Order, OrderItem } from "@/db/schema";

export type { Order, OrderItem };

/** Free delivery above this, matching what the home page promises. */
export const FREE_DELIVERY_PAISE = 499900; // ₹4,999
export const SHIPPING_PAISE = 4900; // ₹49

/**
 * The order reference a customer is given.
 *
 * No O/0 and no I/1: this number's whole job is to survive being read off a
 * screen, typed into a support chat, or said out loud on a phone call, and
 * those are the pairs people get wrong.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newReference = () =>
  "ZY-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

export interface OrderLine {
  readonly productId: number;
  readonly qty: number;
}

export interface Address {
  readonly customerName: string;
  readonly email: string;
  readonly phone: string;
  readonly addressLine: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
}

export type PlaceResult =
  | { readonly ok: true; readonly reference: string }
  | { readonly ok: false; readonly reason: "empty" | "invalid" | "unavailable" };

/** Per-line cap. A storefront order is not a wholesale one. */
const MAX_QTY = 20;

/**
 * Place an order, in one statement.
 *
 * Everything here — checking stock, decrementing it, writing the order and
 * writing its lines — happens inside a single SQL statement, which Postgres
 * runs atomically. That is the point rather than an optimisation: read stock,
 * then write it, is the oldest race in a shop, and two people buying the last
 * knife set a moment apart would both be told yes.
 *
 * `feasible` gates the writes. If any line is missing or short, it is false,
 * every write below matches zero rows, and nothing at all happened — no
 * partial decrement to unwind, and the caller gets `unavailable`.
 *
 * Prices are read from the products table inside the same statement rather
 * than being sent from the browser. A checkout that trusts a client-supplied
 * price is a checkout that sells at whatever price the client asks for.
 */
export async function placeOrder(lines: OrderLine[], address: Address): Promise<PlaceResult> {
  if (!Array.isArray(lines) || lines.length === 0) return { ok: false, reason: "empty" };

  // A bad line rejects the whole order rather than being dropped from it.
  // Filtering here looked tidy and was wrong: an order with one unreadable
  // line would quietly become an order for everything else, and the customer
  // would be charged for — and sent — something they did not ask for.
  const clean = lines.map((l) => ({
    productId: Math.trunc(Number(l.productId)),
    qty: Math.trunc(Number(l.qty)),
  }));
  const usable = clean.every(
    (l) =>
      Number.isInteger(l.productId) && l.productId > 0 &&
      Number.isInteger(l.qty) && l.qty > 0 && l.qty <= MAX_QTY
  );
  if (!usable) return { ok: false, reason: "invalid" };

  // The same product twice would decrement stock once per row while charging
  // for both, so a repeated id is a malformed order, not two lines.
  if (new Set(clean.map((l) => l.productId)).size !== clean.length)
    return { ok: false, reason: "invalid" };

  const sql = neon(process.env.DATABASE_URL!);
  const reference = newReference();

  const rows = (await sql.query(
    `
    WITH wanted(product_id, qty) AS (
      SELECT * FROM unnest($1::int[], $2::int[])
    ),
    feasible AS (
      SELECT NOT EXISTS (
        SELECT 1 FROM wanted w
        LEFT JOIN products p ON p.id = w.product_id
        WHERE p.id IS NULL OR p.stock < w.qty
      ) AS ok
    ),
    priced AS (
      SELECT w.product_id, w.qty, p.title, p.thumbnail,
             (round(p.price::numeric * 84) * 100)::int AS unit_paise
      FROM wanted w JOIN products p ON p.id = w.product_id
    ),
    totals AS (
      SELECT COALESCE(SUM(unit_paise * qty), 0)::int AS subtotal FROM priced
    ),
    ship AS (
      SELECT CASE WHEN t.subtotal >= $10 THEN 0 ELSE $11 END AS shipping FROM totals t
    ),
    decremented AS (
      UPDATE products p SET stock = p.stock - w.qty
      FROM wanted w, feasible f
      WHERE p.id = w.product_id AND f.ok
      RETURNING p.id
    ),
    new_order AS (
      INSERT INTO orders (
        reference, customer_name, email, phone, address_line, city, state,
        pincode, subtotal_paise, shipping_paise, total_paise, payment_method
      )
      SELECT $3, $4, $5, $6, $7, $8, $9, $12,
             t.subtotal, s.shipping, t.subtotal + s.shipping, 'cod'
      FROM feasible f, totals t, ship s
      WHERE f.ok
      RETURNING id, reference
    ),
    written AS (
      INSERT INTO order_items (order_id, product_id, title, thumbnail, unit_paise, qty)
      SELECT o.id, p.product_id, p.title, p.thumbnail, p.unit_paise, p.qty
      FROM new_order o, priced p
      RETURNING id
    )
    SELECT (SELECT ok FROM feasible) AS ok,
           (SELECT reference FROM new_order) AS reference,
           (SELECT count(*) FROM written)::int AS n
    `,
    [
      clean.map((l) => l.productId),
      clean.map((l) => l.qty),
      reference,
      address.customerName,
      address.email,
      address.phone,
      address.addressLine,
      address.city,
      address.state,
      FREE_DELIVERY_PAISE,
      SHIPPING_PAISE,
      address.pincode,
    ]
  )) as unknown as Array<{ ok: boolean; reference: string | null }>;

  const result = rows[0];
  if (!result?.ok || !result.reference) return { ok: false, reason: "unavailable" };
  return { ok: true, reference: result.reference };
}

/** An order and its lines, by the reference the customer was given. */
export async function orderByReference(reference: string) {
  if (typeof reference !== "string" || !/^ZY-[A-Z0-9]{6}$/.test(reference)) return null;

  const [order] = await db.select().from(orders).where(eq(orders.reference, reference)).limit(1);
  if (!order) return null;

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id));

  return { order, items };
}
