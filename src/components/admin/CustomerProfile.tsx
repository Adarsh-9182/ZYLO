import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { count, date, Heading, money, OrdersTable, SectionHead } from "@/components/admin/UI";

export async function CustomerProfile({ email: rawEmail }: { email: string }) {
  await requireOwner();
  let email = rawEmail;
  try { email = decodeURIComponent(email); } catch { notFound(); }
  email = email.toLowerCase();
  if (email.length > 200) notFound();
  const sql = adminSql();
  const [[summary], orders, products] = await Promise.all([
    sql`SELECT count(*)::int AS orders,coalesce(sum(total_paise) FILTER(WHERE status NOT IN ('cancelled','returned')),0)::bigint AS spent,min(placed_at) AS first_order FROM orders WHERE lower(email)=${email}`,
    sql`SELECT o.*,(SELECT coalesce(sum(qty),0) FROM order_items i WHERE i.order_id=o.id) AS item_count,(SELECT string_agg(title,', ') FROM order_items i WHERE i.order_id=o.id) AS item_summary FROM orders o WHERE lower(email)=${email} ORDER BY placed_at DESC`,
    sql`SELECT i.product_id,min(i.title) AS title,min(i.thumbnail) AS thumbnail,sum(i.qty)::int AS units FROM order_items i JOIN orders o ON o.id=i.order_id WHERE lower(o.email)=${email} AND o.status NOT IN ('cancelled','returned') GROUP BY i.product_id ORDER BY units DESC LIMIT 10`,
  ]);
  if (!orders.length) notFound();
  const latest = orders[0];
  return <>
    <Link className="a-back" href="/admin/customers">← Back to customers</Link>
    <Heading title={String(latest.customer_name)} description={email} />
    <div className="a-two-col">
      <section className="a-card"><SectionHead title="Customer overview" />
        <div className="a-inline-metrics">
          <div><strong>{count(summary.orders)}</strong><span>Orders placed</span></div>
          <div><strong>{money(summary.spent)}</strong><span>Total ordered, excluding returns</span></div>
          <div><strong>{date(summary.first_order, true)}</strong><span>Customer since</span></div>
        </div>
        <div className="a-detail-body"><a href={`mailto:${email}`}>{email}</a> · <a href={`tel:${latest.phone}`}>{String(latest.phone)}</a><br />{String(latest.address_line)}, {String(latest.city)}, {String(latest.state)} {String(latest.pincode)}</div>
      </section>
      <section className="a-card"><SectionHead title="Products purchased" /><div className="a-product-list">
        {products.map((p) => <div key={String(p.product_id)} className="a-product-row"><Image unoptimized width={480} height={400} src={String(p.thumbnail)} className="a-thumb" alt="" /><div><strong>{String(p.title)}</strong><small>{count(p.units)} units ordered</small></div></div>)}
      </div></section>
    </div>
    <section className="a-card"><SectionHead title="Order history" /><OrdersTable rows={orders} /></section>
  </>;
}
