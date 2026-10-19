import Link from "next/link";
import { redirect } from "next/navigation";
import { customer } from "@/lib/customer-auth/server";
import { adminSql } from "@/lib/admin/db";
import { CustomerSignOut } from "@/components/CustomerSignOut";
import { formatINR } from "@/lib/format";
export const metadata = { title: "My account — Zylo" };
export default async function Account() {
  const user = await customer();
  if (!user) redirect("/login");
  const sql = adminSql();
  const orders =
    await sql`SELECT o.reference,o.status,o.total_paise,o.placed_at,(SELECT string_agg(i.title || ' × ' || i.qty::text,', ') FROM order_items i WHERE i.order_id=o.id) AS items FROM orders o WHERE o.customer_id=${user.id} OR (${user.emailVerified} AND lower(o.email)=${user.email.toLowerCase()}) ORDER BY o.placed_at DESC LIMIT 100`;
  return (
    <div className="customer-account">
      <nav className="customer-account-nav" aria-label="Account">
        <Link href="/">zylo</Link>
        <div className="customer-account-actions">
          <Link href="/search">Shop</Link>
          <CustomerSignOut />
        </div>
      </nav>
      <h1>Hello, {user.name?.split(" ")[0] || "there"}</h1>
      <p className="customer-account-email">{user.email}</p>
      {!user.emailVerified && (
        <p className="customer-account-info">
          Orders placed while you’re signed in appear here. For an earlier guest
          order,{" "}
          <Link href="/track-order" style={{ textDecoration: "underline" }}>
            track it using your order reference
          </Link>
          .
        </p>
      )}
      <h2>Your orders</h2>
      {orders.length ? (
        <div>
          {orders.map((order) => (
            <article
              className="customer-account-order"
              key={String(order.reference)}
            >
              <div>
                <strong>{String(order.reference)}</strong>
                <p>
                  {new Date(String(order.placed_at)).toLocaleDateString(
                    "en-IN",
                    { day: "numeric", month: "long", year: "numeric" },
                  )}{" "}
                  · {String(order.status).replaceAll("_", " ")}
                </p>
                <p>{String(order.items)}</p>
              </div>
              <div>
                <strong>{formatINR(Number(order.total_paise) / 100)}</strong>
                <p>
                  <Link href={`/order/${order.reference}`}>View order</Link>
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="customer-account-empty">
          <strong>Your first order starts here</strong>
          <p>
            Browse the shop and find something you love.
            <br />
            Your orders and delivery updates will appear here.
          </p>
          <Link className="customer-auth-primary" href="/search">
            Start shopping
          </Link>
        </div>
      )}
    </div>
  );
}
