import Link from "next/link";
import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { pageNumber } from "@/lib/admin/queries";
import { STATUSES } from "@/lib/admin/validation";
import {
  count,
  ExportButton,
  Heading,
  OrdersTable,
  Pagination,
} from "@/components/admin/UI";
export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    payment?: string;
    page?: string;
  }>;
}) {
  await requireOwner();
  const { q = "", status = "", payment = "", page: raw } = await searchParams;
  const page = pageNumber(raw),
    query = q.slice(0, 200),
    like = `%${query}%`;
  const sql = adminSql();
  const statusFilter = STATUSES.includes(status as (typeof STATUSES)[number])
      ? status
      : "",
    paymentFilter = ["pending", "paid", "refunded"].includes(payment)
      ? payment
      : "";
  const [rows, [total], summary] = await Promise.all([
    sql`SELECT o.*,(SELECT coalesce(sum(qty),0)::int FROM order_items i WHERE i.order_id=o.id) AS item_count,(SELECT string_agg(title,', ') FROM order_items i WHERE i.order_id=o.id) AS item_summary FROM orders o WHERE (${statusFilter}='' OR status=${statusFilter}) AND (${paymentFilter}='' OR payment_status=${paymentFilter}) AND (${query}='' OR reference ILIKE ${like} OR customer_name ILIKE ${like} OR email ILIKE ${like} OR phone ILIKE ${like} OR EXISTS(SELECT 1 FROM order_items i WHERE i.order_id=o.id AND i.title ILIKE ${like})) ORDER BY placed_at DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
    sql`SELECT count(*)::int AS n FROM orders o WHERE (${statusFilter}='' OR status=${statusFilter}) AND (${paymentFilter}='' OR payment_status=${paymentFilter}) AND (${query}='' OR reference ILIKE ${like} OR customer_name ILIKE ${like} OR email ILIKE ${like} OR phone ILIKE ${like} OR EXISTS(SELECT 1 FROM order_items i WHERE i.order_id=o.id AND i.title ILIKE ${like}))`,
    sql`SELECT status,count(*)::int AS n FROM orders GROUP BY status`,
  ]);
  const n = (s: string) => summary.find((r) => r.status === s)?.n ?? 0;
  return (
    <>
      <Heading
        eyebrow="FROM YOUR STORE TO THEIR DOOR"
        title="Orders"
        description="Know who ordered, what they bought and what happens next."
      >
        <ExportButton type="orders" />
      </Heading>
      <section className="a-card">
        <div className="a-table-tools">
          <nav className="a-tabs" aria-label="Order status">
            {[
              [
                "",
                `All orders (${summary.reduce((s, r) => s + Number(r.n), 0)})`,
              ],
              ["placed", `New (${n("placed")})`],
              ["shipped", `Shipped (${n("shipped")})`],
              ["delivered", `Delivered (${n("delivered")})`],
            ].map(([s, label]) => (
              <Link
                key={s}
                className={statusFilter === s ? "is-active" : ""}
                href={`/admin/orders?status=${s}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <form className="a-filter">
            <input
              name="q"
              defaultValue={query}
              placeholder="Order, customer or product…"
              aria-label="Search orders"
            />
            <select
              name="status"
              defaultValue={statusFilter}
              aria-label="Order status"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="payment"
              defaultValue={paymentFilter}
              aria-label="Payment status"
            >
              <option value="">All payments</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
            </select>
            <button className="a-button a-secondary a-small">Filter</button>
          </form>
        </div>
        <OrdersTable rows={rows} />
        <Pagination
          page={page}
          total={Number(total.n)}
          base="/admin/orders"
          params={{ q: query, status: statusFilter, payment: paymentFilter }}
        />
      </section>
      <p className="a-subtle mt-4">
        {count(summary.reduce((s, r) => s + Number(r.n), 0))} orders received
        across your store. Payment collection is recorded separately from
        fulfillment.
      </p>
    </>
  );
}
