import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { adminSql } from "@/lib/admin/db";
import { digest, rateLimit } from "@/lib/admin/auth";
import { NextResponse } from "next/server";
import { placeOrder, type OrderLine } from "@/lib/orders";
import { customer } from "@/lib/customer-auth/server";

/** Everything an address field is allowed to be. */
const FIELDS = [
  ["customerName", 2, 120],
  ["email", 5, 200],
  ["phone", 10, 20],
  ["addressLine", 6, 400],
  ["city", 2, 80],
  ["state", 2, 80],
  ["pincode", 6, 10],
] as const;

const MESSAGES: Record<string, string> = {
  empty: "Your cart is empty.",
  invalid: "That order could not be read. Refresh and try again.",
  unavailable:
    "Something in your cart just went out of stock. Adjust the quantities and try again.",
};

/**
 * Place an order.
 *
 * The browser sends what it wants to buy and where to send it — never what it
 * costs. Prices, the shipping rule and the stock check all live in
 * placeOrder's single statement, so a crafted request can change the address
 * on an order and nothing else about it.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: MESSAGES.invalid }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;

  const address: Record<string, string> = {};
  for (const [field, min, max] of FIELDS) {
    const value =
      typeof input[field] === "string" ? (input[field] as string).trim() : "";
    if (value.length < min || value.length > max)
      return NextResponse.json(
        {
          error: `Please check the ${field === "customerName" ? "name" : field} field.`,
        },
        { status: 400 },
      );
    address[field] = value;
  }
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(address.email!))
    return NextResponse.json(
      { error: "That email address does not look right." },
      { status: 400 },
    );
  if (!/^\d{6}$/.test(address.pincode!))
    return NextResponse.json(
      { error: "A PIN code is six digits." },
      { status: 400 },
    );
  if (!/^[\d+\-\s]{10,20}$/.test(address.phone!))
    return NextResponse.json(
      { error: "That phone number does not look right." },
      { status: 400 },
    );

  const rawLines = Array.isArray(input.lines) ? input.lines : [];
  if (rawLines.length > 50)
    return NextResponse.json({ error: MESSAGES.invalid }, { status: 400 });

  const lines: OrderLine[] = rawLines.map((l) => {
    const line = (l ?? {}) as Record<string, unknown>;
    return { productId: Number(line.productId), qty: Number(line.qty) };
  });

  const requestKey =
    typeof input.requestKey === "string" ? input.requestKey : "";
  if (!/^[a-f0-9-]{36}$/i.test(requestKey))
    return NextResponse.json(
      { error: "Refresh checkout and try again." },
      { status: 400 },
    );
  try {
    if (!(await rateLimit("checkout", 30)))
      return NextResponse.json(
        { error: "Too many checkout attempts. Please try again later." },
        { status: 429 },
      );
    const user = await customer();
    if (user) address.customerId = user.id;
    const result = await placeOrder(
      lines,
      address as unknown as Parameters<typeof placeOrder>[1],
      requestKey,
    );
    if (!result.ok)
      return NextResponse.json(
        { error: MESSAGES[result.reason] ?? MESSAGES.invalid },
        { status: result.reason === "unavailable" ? 409 : 400 },
      );

    const sql = adminSql(),
      token = randomBytes(32).toString("hex");
    await sql`INSERT INTO order_access(token_hash,order_id,expires_at) SELECT ${digest(token)},id,now()+interval '30 days' FROM orders WHERE reference=${result.reference}`;
    (await cookies()).set("zylo_order_" + result.reference, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/order/" + result.reference,
      maxAge: 60 * 60 * 24 * 30,
    });
    return NextResponse.json({ reference: result.reference });
  } catch (e) {
    console.error(
      "Checkout failed",
      (e as { code?: string }).code ?? "unknown",
    );
    return NextResponse.json(
      {
        error:
          "We could not confirm this order. Please retry with the same checkout.",
      },
      { status: 503 },
    );
  }
}
