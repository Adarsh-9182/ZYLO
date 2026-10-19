import "server-only";
import { randomInt, createHash } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { digest, owner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { eq, asc } from "drizzle-orm";
import { customer } from "@/lib/customer-auth/server";
export type { Order, OrderItem } from "@/db/schema";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newReference = () =>
  "ZY-" +
  Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(
    "",
  );
export interface OrderLine {
  readonly productId: number;
  readonly qty: number;
}
export interface Address {
  readonly customerId?: string;
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
  | {
      readonly ok: false;
      readonly reason: "empty" | "invalid" | "unavailable";
    };

/** Locks stock in id order; one atomic statement reserves all lines and captures prices. */
export async function placeOrder(
  lines: OrderLine[],
  address: Address,
  requestKey: string,
): Promise<PlaceResult> {
  if (!Array.isArray(lines) || !lines.length)
    return { ok: false, reason: "empty" };
  if (
    lines.length > 50 ||
    !lines.every(
      (l) =>
        Number.isSafeInteger(l.productId) &&
        l.productId > 0 &&
        l.productId <= 2147483647 &&
        Number.isSafeInteger(l.qty) &&
        l.qty > 0 &&
        l.qty <= 20,
    ) ||
    new Set(lines.map((l) => l.productId)).size !== lines.length ||
    !/^[a-f0-9-]{36}$/i.test(requestKey)
  )
    return { ok: false, reason: "invalid" };
  const sql = neon(process.env.DATABASE_URL!);
  const requestHash = createHash("sha256")
    .update(
      JSON.stringify({
        lines: [...lines].sort((a, b) => a.productId - b.productId),
        address,
      }),
    )
    .digest("hex");
  const previous = async () => {
    const [o] =
      await sql`SELECT reference,request_hash FROM orders WHERE request_key=${requestKey}`;
    return o
      ? o.request_hash === requestHash
        ? { ok: true as const, reference: String(o.reference) }
        : { ok: false as const, reason: "invalid" as const }
      : null;
  };
  const existing = await previous();
  if (existing) return existing;
  try {
    const rows = await sql.query(
      `
 WITH wanted(product_id,qty) AS (SELECT * FROM unnest($1::int[],$2::int[])),
 locked AS MATERIALIZED (SELECT p.id,p.title,p.thumbnail,p.price,p.stock,p.active FROM products p JOIN wanted w ON w.product_id=p.id ORDER BY p.id FOR UPDATE OF p),
 feasible AS (SELECT (SELECT count(*) FROM locked)=(SELECT count(*) FROM wanted) AND NOT EXISTS(SELECT 1 FROM locked p JOIN wanted w ON w.product_id=p.id WHERE NOT p.active OR p.stock<w.qty) AS ok),
 priced AS (SELECT p.id AS product_id,w.qty,p.title,p.thumbnail,(round(p.price::numeric*84)*100)::int AS unit_paise FROM locked p JOIN wanted w ON w.product_id=p.id),
 totals AS (SELECT coalesce(sum(unit_paise::bigint*qty),0)::bigint AS subtotal FROM priced),
 ship AS (SELECT CASE WHEN t.subtotal>=s.free_shipping_above_paise THEN 0 ELSE s.shipping_paise END AS shipping FROM totals t CROSS JOIN store_settings s WHERE s.id=1),
 decremented AS (UPDATE products p SET stock=l.stock-w.qty,version=p.version+1,updated_at=now() FROM wanted w,locked l,feasible f WHERE p.id=w.product_id AND l.id=p.id AND f.ok RETURNING p.id),
 new_order AS (INSERT INTO orders(reference,customer_name,email,phone,address_line,city,state,pincode,subtotal_paise,shipping_paise,total_paise,payment_method,request_key,request_hash,customer_id)
 SELECT $3,$4,$5,$6,$7,$8,$9,$10,t.subtotal,s.shipping,t.subtotal+s.shipping,'cod',$11,$12,$13 FROM feasible f,totals t,ship s WHERE f.ok RETURNING id,reference),
 written AS (INSERT INTO order_items(order_id,product_id,title,thumbnail,unit_paise,qty) SELECT o.id,p.product_id,p.title,p.thumbnail,p.unit_paise,p.qty FROM new_order o,priced p RETURNING id),
 movements AS (INSERT INTO inventory_movements(product_id,product_title,delta,reason,order_id) SELECT p.product_id,p.title,-p.qty,'Order placed',o.id FROM priced p,new_order o),
 event AS (INSERT INTO order_events(order_id,status,note) SELECT id,'placed','Order placed by customer' FROM new_order)
 SELECT (SELECT ok FROM feasible) AS ok,(SELECT reference FROM new_order) AS reference,(SELECT count(*) FROM written)::int AS n`,
      [
        lines.map((l) => l.productId),
        lines.map((l) => l.qty),
        newReference(),
        address.customerName,
        address.email.toLowerCase(),
        address.phone,
        address.addressLine,
        address.city,
        address.state,
        address.pincode,
        requestKey,
        requestHash,
        address.customerId ?? null,
      ],
    );
    const result = rows[0];
    return result?.ok && result.reference
      ? { ok: true, reference: String(result.reference) }
      : { ok: false, reason: "unavailable" };
  } catch (e) {
    if ((e as { code?: string }).code === "23505") {
      const retry = await previous();
      if (retry) return retry;
    }
    throw e;
  }
}

/** An order and its lines, by the reference the customer was given. */
export async function orderByReference(reference: string) {
  if (typeof reference !== "string" || !/^ZY-[A-Z0-9]{6,12}$/.test(reference))
    return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.reference, reference))
    .limit(1);
  if (!order) return null;
  const token = (await cookies()).get("zylo_order_" + reference)?.value;
  const sql = adminSql();
  const access = token
    ? await sql`SELECT 1 FROM order_access WHERE token_hash=${digest(token)} AND order_id=${order.id} AND expires_at>now()`
    : [];
  if (!access.length && !(await owner())) {
    const user = await customer();
    const ownsOrder = user && (order.customerId === user.id || (user.emailVerified && user.email.toLowerCase() === order.email.toLowerCase()));
    if (!ownsOrder) redirect("/track-order");
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(asc(orderItems.id));

  return { order, items };
}
