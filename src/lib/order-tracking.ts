"use server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { adminSql } from "@/lib/admin/db";
import { digest, rateLimit } from "@/lib/admin/auth";
import type { ActionState } from "@/lib/admin/actions";
export async function trackOrderAction(
  _: ActionState,
  form: FormData,
): Promise<ActionState> {
  let reference = "";
  try {
    if (!(await rateLimit("order-tracking", 10)))
      return { error: "Too many attempts. Please try again in 15 minutes." };
    reference = String(form.get("reference") ?? "")
      .trim()
      .toUpperCase();
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    if (!/^ZY-[A-Z0-9]{6,12}$/.test(reference) || email.length > 200)
      return { error: "Check the order reference and email address." };
    const sql = adminSql();
    const [order] =
      await sql`SELECT id FROM orders WHERE reference=${reference} AND lower(email)=${email}`;
    if (!order)
      return {
        error:
          "We couldn’t find that order. Check the reference and the email used at checkout.",
      };
    const token = randomBytes(32).toString("hex");
    await sql`INSERT INTO order_access(token_hash,order_id,expires_at) VALUES(${digest(token)},${order.id},now()+interval '30 days')`;
    (await cookies()).set("zylo_order_" + reference, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/order/" + reference,
      maxAge: 60 * 60 * 24 * 30,
    });
  } catch {
    return {
      error: "We couldn’t look up this order. Please try again shortly.",
    };
  }
  redirect("/order/" + reference);
}
