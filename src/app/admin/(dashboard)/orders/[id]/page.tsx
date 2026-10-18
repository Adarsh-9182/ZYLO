import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import {
  Badge,
  count,
  date,
  Heading,
  money,
  SectionHead,
} from "@/components/admin/UI";
import { OrderForm } from "@/components/admin/Forms";
import { PrintButton } from "@/components/admin/PrintButton";
export default async function OrderDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const saved = (await searchParams).saved;
  await requireOwner();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const sql = adminSql();
  const [[o], items, events] = await Promise.all([
    sql`SELECT * FROM orders WHERE id=${id}`,
    sql`SELECT * FROM order_items WHERE order_id=${id} ORDER BY id`,
    sql`SELECT * FROM order_events WHERE order_id=${id} ORDER BY created_at DESC`,
  ]);
  if (!o) notFound();
  return (
    <>
      <Link href="/admin/orders" className="a-back">
        ← Back to orders
      </Link>
      <Heading
        title={String(o.reference)}
        description={`Placed ${date(o.placed_at, true)} · ${items.reduce((s, i) => s + Number(i.qty), 0)} items`}
      >
        <Badge status={o.status} />
        <PrintButton />
      </Heading>
      {saved && (
        <p role="status" className="a-notice a-success">
          Order updated. Stock changes, if any, have been recorded.
        </p>
      )}
      <h2 className="a-print-title">ZYLO · Packing slip</h2>
      <div className="a-order-layout">
        <div className="a-order-main">
          <section className="a-card">
            <SectionHead
              title="Items in this order"
              description="Prices and product details captured at checkout."
            />
            <div className="a-table-scroll">
              <table className="a-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit price</th>
                    <th>Quantity</th>
                    <th className="a-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={String(i.id)}>
                      <td>
                        <Link
                          href={`/admin/products/${i.product_id}`}
                          className="a-customer-cell"
                        >
                          <Image
                            unoptimized
                            width={480}
                            height={400}
                            src={String(i.thumbnail)}
                            className="a-thumb"
                            alt=""
                          />
                          <span>
                            <strong>{String(i.title)}</strong>
                            <small>Product #{String(i.product_id)}</small>
                          </span>
                        </Link>
                      </td>
                      <td>{money(i.unit_paise)}</td>
                      <td>{count(i.qty)}</td>
                      <td className="a-right a-amount">
                        {money(Number(i.unit_paise) * Number(i.qty))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="a-totals">
              <div>
                <span>Subtotal</span>
                <span>{money(o.subtotal_paise)}</span>
              </div>
              <div>
                <span>Shipping</span>
                <span>
                  {Number(o.shipping_paise) ? money(o.shipping_paise) : "Free"}
                </span>
              </div>
              <div>
                <span>Total · cash on delivery</span>
                <span>{money(o.total_paise)}</span>
              </div>
            </div>
          </section>
          <div className="a-detail-grid">
            <section className="a-card">
              <SectionHead title="Customer" />
              <div className="a-detail-body">
                <strong>{String(o.customer_name)}</strong>
                <br />
                <a href={`mailto:${o.email}`}>{String(o.email)}</a>
                <br />
                <a href={`tel:${o.phone}`}>{String(o.phone)}</a>
                <br />
                <Link
                  href={`/admin/customers/profile?email=${encodeURIComponent(String(o.email).toLowerCase())}`}
                >
                  View customer history →
                </Link>
              </div>
            </section>
            <section className="a-card">
              <SectionHead title="Delivery address" />
              <address className="a-detail-body not-italic">
                <strong>{String(o.customer_name)}</strong>
                <br />
                {String(o.address_line)}
                <br />
                {String(o.city)}, {String(o.state)}
                <br />
                {String(o.pincode)} · India
              </address>
            </section>
          </div>
          <section className="a-card">
            <SectionHead title="Order timeline" />
            <div className="a-timeline">
              {events.map((e) => (
                <div key={String(e.id)}>
                  <strong>{String(e.note)}</strong>
                  <p>Status: {String(e.status)}</p>
                  <small>
                    {date(e.created_at, true)} ·{" "}
                    {new Date(String(e.created_at)).toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Kolkata",
                      },
                    )}
                  </small>
                </div>
              ))}
              <div>
                <strong>Order placed by customer</strong>
                <p>Cash on delivery · {money(o.total_paise)}</p>
                <small>{date(o.placed_at, true)}</small>
              </div>
            </div>
          </section>
        </div>
        <aside className="a-card">
          <SectionHead
            title="Manage this order"
            description="Keep fulfillment and collections up to date."
          />
          <OrderForm key={String(o.version)} order={o} />
        </aside>
      </div>
    </>
  );
}
