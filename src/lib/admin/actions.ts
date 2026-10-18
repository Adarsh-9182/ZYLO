"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminSql } from "./db";
import {
  COOKIE,
  digest,
  passwordHash,
  passwordMatches,
  rateLimit,
  requireOwner,
  startSession,
} from "./auth";
import {
  canTransition,
  emailAddress,
  externalUrl,
  imageUrl,
  InputError,
  number,
  STATUSES,
  text,
} from "./validation";
export type ActionState = { error?: string; success?: string };
function failure(e: unknown): ActionState {
  if (e instanceof InputError) return { error: e.message };
  if (String((e as { code?: string })?.code) === "23505")
    return { error: "That SKU is already in use. Choose a unique SKU." };
  console.error(
    "Dashboard operation failed",
    (e as { code?: string })?.code ?? "unknown",
  );
  return {
    error:
      "The change could not be saved. Please retry. If it continues, check the database connection.",
  };
}
function refresh(productId?: number) {
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  if (productId) revalidatePath(`/product/${productId}`);
}
export async function loginAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    if (!(await rateLimit("owner-login")))
      throw new InputError(
        "Too many attempts. Please try again in 15 minutes.",
      );
    const email = emailAddress(text(form, "email", 200, 5));
    const password = text(form, "password", 256, 1);
    const sql = adminSql();
    const [user] =
      await sql`SELECT password_hash FROM admin_users WHERE id=1 AND email=${email}`;
    // Run scrypt even for an unknown account to avoid a fast user-enumeration path.
    const valid = passwordMatches(
      password,
      user?.password_hash ??
        "00000000000000000000000000000000:" + "00".repeat(64),
    );
    if (!user || !valid)
      throw new InputError("Email or password is incorrect.");
    await startSession();
  } catch (e) {
    return failure(e);
  }
  redirect("/admin");
}
export async function setupAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    if (!(await rateLimit("owner-setup")))
      throw new InputError("Too many attempts. Try again in 15 minutes.");
    const token = text(form, "token", 64, 64);
    const email = emailAddress(text(form, "email", 200, 5));
    const password = text(form, "password", 256, 12);
    if (password !== text(form, "confirmPassword", 256, 12))
      throw new InputError("The passwords do not match.");
    const sql = adminSql();
    const result =
      await sql`UPDATE admin_users SET email=${email},password_hash=${passwordHash(password)},setup_token_hash=NULL,setup_expires_at=NULL WHERE id=1 AND password_hash IS NULL AND setup_token_hash=${digest(token)} AND setup_expires_at>now() RETURNING id`;
    if (!result.length)
      throw new InputError(
        "This setup link has expired or has already been used. Use your owner login, or generate a new setup link.",
      );
    await startSession();
  } catch (e) {
    return failure(e);
  }
  redirect("/admin");
}
export async function logoutAction() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (token) {
    const sql = adminSql();
    await sql`DELETE FROM admin_sessions WHERE token_hash=${digest(token)}`;
  }
  (await cookies()).delete(COOKIE);
  redirect("/admin/login");
}
export async function saveProduct(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  let id = 0;
  try {
    const sql = adminSql();
    id = form.get("id") ? number(form, "id", 1, 2147483647) : 0;
    const version = id ? number(form, "version", 1, 2147483647) : 1;
    const title = text(form, "title", 256, 2),
      description = text(form, "description", 10000, 10);
    const category = text(form, "category", 64, 2)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!category) throw new InputError("Enter a category name.");
    const brand = text(form, "brand", 128),
      sku = text(form, "sku", 80) || null;
    const price = number(form, "priceINR", 1, 1000000) / 84;
    const discount = number(form, "discountPercentage", 0, 95, false);
    const thumbnail = imageUrl(text(form, "thumbnail", 2000, 2));
    const images = text(form, "images", 16000)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(imageUrl);
    if (images.length > 8)
      throw new InputError("Use up to eight gallery images.");
    const tags = text(form, "tags", 1000)
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
    const shipping = text(form, "shippingInformation", 300),
      returns = text(form, "returnPolicy", 500),
      warranty = text(form, "warrantyInformation", 300);
    const active = form.get("active") === "on",
      house = form.get("house") === "on";
    if (id) {
      const result = await sql`WITH changed AS (
        UPDATE products SET title=${title},description=${description},category=${category},brand=${brand || null},sku=${sku},price=${price},discount_percentage=${discount},thumbnail=${thumbnail},images=${images},tags=${tags},shipping_information=${shipping},return_policy=${returns},warranty_information=${warranty},active=${active},house=${house},version=version+1,updated_at=now()
        WHERE id=${id} AND version=${version} RETURNING id,title
      ), logged AS (INSERT INTO admin_activity(action,detail) SELECT 'Product updated',title FROM changed)
      SELECT id FROM changed`;
      if (!result.length)
        throw new InputError(
          "This product changed in another tab. Reload before saving.",
        );
    } else {
      const stock = number(form, "stock", 0, 1000000);
      const result = await sql`WITH created AS (
        INSERT INTO products(title,description,category,brand,sku,price,discount_percentage,stock,thumbnail,images,tags,shipping_information,return_policy,warranty_information,active,house)
        VALUES(${title},${description},${category},${brand || null},${sku},${price},${discount},${stock},${thumbnail},${images},${tags},${shipping},${returns},${warranty},${active},${house}) RETURNING id,title
      ), movement AS (INSERT INTO inventory_movements(product_id,product_title,delta,reason) SELECT id,title,${stock},'Opening stock' FROM created),
      logged AS (INSERT INTO admin_activity(action,detail) SELECT 'Product created',title FROM created)
      SELECT id FROM created`;
      id = Number(result[0].id);
    }
  } catch (e) {
    return failure(e);
  }
  refresh(id);
  redirect("/admin/products?saved=1");
}
export async function toggleProduct(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  let id = 0;
  try {
    id = number(form, "id", 1, 2147483647);
    const version = number(form, "version", 1, 2147483647);
    const active = form.get("active") === "true";
    const sql = adminSql();
    const rows =
      await sql`WITH changed AS (UPDATE products SET active=${active},version=version+1,updated_at=now() WHERE id=${id} AND version=${version} RETURNING title), logged AS (INSERT INTO admin_activity(action,detail) SELECT ${active ? "Product published" : "Product archived"},title FROM changed) SELECT title FROM changed`;
    if (!rows.length)
      throw new InputError("Product changed. Reload and try again.");
  } catch (e) {
    return failure(e);
  }
  refresh(id);
  return { success: "Product visibility updated." };
}
export async function adjustStock(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  let id = 0;
  try {
    id = number(form, "id", 1, 2147483647);
    const delta = number(form, "delta", -1000000, 1000000);
    if (!delta)
      throw new InputError("Enter a positive or negative stock change.");
    const reason = text(form, "reason", 300, 3);
    const sql = adminSql();
    const rows =
      await sql`WITH changed AS (UPDATE products SET stock=stock+${delta},version=version+1,updated_at=now() WHERE id=${id} AND stock+${delta} BETWEEN 0 AND 1000000 RETURNING id,title),
      movement AS (INSERT INTO inventory_movements(product_id,product_title,delta,reason) SELECT id,title,${delta},${reason} FROM changed),
      logged AS (INSERT INTO admin_activity(action,detail) SELECT 'Stock adjusted',title || ': ' || ${String(delta)} || ' (' || ${reason} || ')' FROM changed)
      SELECT id FROM changed`;
    if (!rows.length)
      throw new InputError(
        "Stock cannot go below zero or above 1,000,000. Reload to see the latest quantity.",
      );
  } catch (e) {
    return failure(e);
  }
  refresh(id);
  return { success: "Stock updated and recorded in inventory history." };
}
export async function updateOrder(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  let orderId = 0;
  try {
    const sql = adminSql();
    const id = number(form, "id", 1, 2147483647),
      version = number(form, "version", 1, 2147483647);
    orderId = id;
    const status = text(form, "status", 20, 1);
    const paymentStatus = text(form, "paymentStatus", 20, 1);
    const carrier = text(form, "carrier", 100),
      trackingNumber = text(form, "trackingNumber", 120),
      trackingUrl = externalUrl(text(form, "trackingUrl", 2000)),
      note = text(form, "internalNote", 4000);
    const [order] =
      await sql`SELECT status,payment_status FROM orders WHERE id=${id}`;
    if (
      !order ||
      !STATUSES.includes(status as (typeof STATUSES)[number]) ||
      !canTransition(order.status, status)
    )
      throw new InputError(
        "That status change is not available. Reload to see this order's latest status.",
      );
    if (!["pending", "paid", "refunded"].includes(paymentStatus))
      throw new InputError("Choose a valid payment status.");
    if (paymentStatus === "paid" && !["delivered", "returned"].includes(status))
      throw new InputError("COD payment can be recorded after delivery.");
    if (paymentStatus === "refunded" && status !== "returned")
      throw new InputError("Refunds can be recorded for returned orders.");
    if (
      (order.payment_status === "paid" && paymentStatus === "pending") ||
      (order.payment_status === "refunded" && paymentStatus !== "refunded")
    )
      throw new InputError("A recorded payment cannot be reset to pending.");
    const restock =
      status !== order.status && ["cancelled", "returned"].includes(status);
    const result = await sql`WITH changed AS (
      UPDATE orders SET status=${status},payment_status=${paymentStatus},carrier=${carrier},tracking_number=${trackingNumber},tracking_url=${trackingUrl},internal_note=${note},version=version+1,updated_at=now()
      WHERE id=${id} AND version=${version} AND status=${order.status} RETURNING id,reference
    ), quantities AS (SELECT i.product_id,sum(i.qty)::int AS qty FROM order_items i,changed o WHERE i.order_id=o.id AND ${restock} GROUP BY i.product_id),
    stocked AS (UPDATE products p SET stock=p.stock+q.qty,version=p.version+1,updated_at=now() FROM quantities q WHERE p.id=q.product_id RETURNING p.id,p.title,q.qty),
    movements AS (INSERT INTO inventory_movements(product_id,product_title,delta,reason,order_id) SELECT id,title,qty,${status === "returned" ? "Order returned" : "Order cancelled"},${id} FROM stocked),
    event AS (INSERT INTO order_events(order_id,status,note) SELECT id,${status},${`Status: ${status}; payment: ${paymentStatus}${carrier ? `; courier: ${carrier}` : ""}`} FROM changed),
    logged AS (INSERT INTO admin_activity(action,detail) SELECT 'Order updated',reference || ' → ' || ${status} FROM changed)
    SELECT id FROM changed`;
    if (!result.length)
      throw new InputError(
        "This order changed in another tab. Reload before saving.",
      );
  } catch (e) {
    return failure(e);
  }
  refresh();
  redirect(`/admin/orders/${orderId}?saved=1`);
}
export async function saveSettings(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  try {
    const sql = adminSql();
    const name = text(form, "storeName", 120, 2),
      email = emailAddress(text(form, "supportEmail", 200, 5)),
      phone = text(form, "supportPhone", 30),
      address = text(form, "businessAddress", 1000);
    const threshold = number(form, "lowStockThreshold", 0, 10000),
      shipping = number(form, "shippingINR", 0, 100000) * 100,
      free = number(form, "freeShippingINR", 0, 1000000) * 100;
    await sql.transaction([
      sql`UPDATE store_settings SET store_name=${name},support_email=${email},support_phone=${phone},business_address=${address},low_stock_threshold=${threshold},shipping_paise=${shipping},free_shipping_above_paise=${free},updated_at=now() WHERE id=1`,
      sql`INSERT INTO admin_activity(action,detail) VALUES('Store settings updated',${name})`,
    ]);
  } catch (e) {
    return failure(e);
  }
  refresh();
  return { success: "Store settings saved." };
}
export async function changePassword(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  await requireOwner();
  try {
    const current = text(form, "currentPassword", 256, 1),
      password = text(form, "newPassword", 256, 12);
    if (password !== text(form, "confirmPassword", 256, 12))
      throw new InputError("The new passwords do not match.");
    const sql = adminSql();
    const [user] = await sql`SELECT password_hash FROM admin_users WHERE id=1`;
    if (!passwordMatches(current, user.password_hash))
      throw new InputError("Current password is incorrect.");
    await sql.transaction([
      sql`UPDATE admin_users SET password_hash=${passwordHash(password)} WHERE id=1`,
      sql`DELETE FROM admin_sessions WHERE admin_id=1`,
      sql`INSERT INTO admin_activity(action,detail) VALUES('Password changed','All previous sessions signed out')`,
    ]);
    await startSession();
  } catch (e) {
    return failure(e);
  }
  return { success: "Password changed. Other sessions have been signed out." };
}

export async function uploadImage(
  form: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireOwner();
  try {
    const file = form.get("image");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024)
      throw new InputError("Choose a JPG, PNG or WebP image up to 2 MB.");
    const bytes = Buffer.from(await file.arrayBuffer());
    let type = "";
    if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
      type = "image/jpeg";
    else if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    )
      type = "image/png";
    else if (
      bytes.subarray(0, 4).toString() === "RIFF" &&
      bytes.subarray(8, 12).toString() === "WEBP"
    )
      type = "image/webp";
    if (!type)
      throw new InputError(
        "That file is not a supported image. Use JPG, PNG or WebP.",
      );
    const { randomUUID } = await import("node:crypto"),
      id = randomUUID(),
      sql = adminSql();
    await sql`INSERT INTO product_media(id,content_type,image_base64,byte_size) VALUES(${id},${type},${bytes.toString("base64")},${bytes.length})`;
    return { url: "/media/" + id };
  } catch (e) {
    return failure(e);
  }
}
