import { NextResponse } from "next/server";
import { placeOrder, type OrderLine } from "@/lib/orders";

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
    const value = typeof input[field] === "string" ? (input[field] as string).trim() : "";
    if (value.length < min || value.length > max)
      return NextResponse.json({ error: `Please check the ${field === "customerName" ? "name" : field} field.` }, { status: 400 });
    address[field] = value;
  }
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(address.email!))
    return NextResponse.json({ error: "That email address does not look right." }, { status: 400 });
  if (!/^\d{6}$/.test(address.pincode!))
    return NextResponse.json({ error: "A PIN code is six digits." }, { status: 400 });
  if (!/^[\d+\-\s]{10,20}$/.test(address.phone!))
    return NextResponse.json({ error: "That phone number does not look right." }, { status: 400 });

  const rawLines = Array.isArray(input.lines) ? input.lines : [];
  if (rawLines.length > 50)
    return NextResponse.json({ error: MESSAGES.invalid }, { status: 400 });

  const lines: OrderLine[] = rawLines.map((l) => {
    const line = (l ?? {}) as Record<string, unknown>;
    return { productId: Number(line.productId), qty: Number(line.qty) };
  });

  const result = await placeOrder(lines, address as unknown as Parameters<typeof placeOrder>[1]);
  if (!result.ok)
    return NextResponse.json(
      { error: MESSAGES[result.reason] ?? MESSAGES.invalid },
      { status: result.reason === "unavailable" ? 409 : 400 }
    );

  return NextResponse.json({ reference: result.reference });
}
