import Image from "next/image";
import Link from "next/link";
import { Boxes, PackageCheck, PackageX, TriangleAlert } from "lucide-react";
import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { pageNumber, storeSettings } from "@/lib/admin/queries";
import {
  Badge,
  count,
  date,
  Empty,
  ExportButton,
  Heading,
  Metric,
  Pagination,
  SectionHead,
} from "@/components/admin/UI";
import { StockForm } from "@/components/admin/Forms";
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  await requireOwner();
  const { q = "", filter = "", page: raw } = await searchParams;
  const page = pageNumber(raw),
    query = q.slice(0, 200),
    like = `%${query}%`,
    s = await storeSettings(),
    threshold = Number(s.low_stock_threshold);
  const sql = adminSql();
  const [rows, [total], [stats], movements] = await Promise.all([
    sql`SELECT * FROM products WHERE active AND (${query}='' OR title ILIKE ${like} OR sku ILIKE ${like}) AND (${filter}!='low' OR stock<=${threshold}) AND (${filter}!='out' OR stock=0) ORDER BY stock ASC,id ASC LIMIT 20 OFFSET ${(page - 1) * 20}`,
    sql`SELECT count(*)::int AS n FROM products WHERE active AND (${query}='' OR title ILIKE ${like} OR sku ILIKE ${like}) AND (${filter}!='low' OR stock<=${threshold}) AND (${filter}!='out' OR stock=0)`,
    sql`SELECT coalesce(sum(stock),0)::bigint AS units,count(*) FILTER(WHERE stock>${threshold})::int AS healthy,count(*) FILTER(WHERE stock>0 AND stock<=${threshold})::int AS low,count(*) FILTER(WHERE stock=0)::int AS out FROM products WHERE active`,
    sql`SELECT * FROM inventory_movements ORDER BY created_at DESC,id DESC LIMIT 15`,
  ]);
  return (
    <>
      <Heading
        eyebrow="A PLACE FOR EVERY PRODUCT"
        title="Inventory"
        description="Know what’s available, what’s running low and what just came in."
      >
        <ExportButton type="inventory" />
      </Heading>
      <div className="a-metrics">
        <Metric
          label="Units in stock"
          value={count(stats.units)}
          detail="Across published products"
          icon={<Boxes />}
        />
        <Metric
          label="Healthy stock"
          value={count(stats.healthy)}
          detail={`Above ${threshold} units`}
          icon={<PackageCheck />}
        />
        <Metric
          label="Running low"
          value={count(stats.low)}
          detail={`1–${threshold} units remaining`}
          icon={<TriangleAlert />}
        />
        <Metric
          label="Out of stock"
          value={count(stats.out)}
          detail="Ready for a restock"
          icon={<PackageX />}
        />
      </div>
      <section className="a-card">
        <div className="a-table-tools">
          <nav className="a-tabs" aria-label="Stock filter">
            {[
              ["", "All inventory"],
              ["low", "Low stock"],
              ["out", "Out of stock"],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/inventory?filter=${key}`}
                className={filter === key ? "is-active" : ""}
              >
                {label}
              </Link>
            ))}
          </nav>
          <form className="a-filter">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search product or SKU…"
              aria-label="Search inventory"
            />
            <input type="hidden" name="filter" value={filter} />
            <button className="a-button a-secondary a-small">Search</button>
          </form>
        </div>
        {rows.length ? (
          <div className="a-table-scroll">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Available</th>
                  <th>Stock level</th>
                  <th>Adjust stock</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={String(p.id)}>
                    <td>
                      <Link
                        className="a-customer-cell"
                        href={`/admin/products/${p.id}`}
                      >
                        <Image
                          unoptimized
                          width={480}
                          height={400}
                          src={String(p.thumbnail)}
                          className="a-thumb"
                          alt=""
                        />
                        <span>
                          <strong>{String(p.title)}</strong>
                          <small>{String(p.sku ?? `#${p.id}`)}</small>
                        </span>
                      </Link>
                    </td>
                    <td className="a-amount">{count(p.stock)}</td>
                    <td>
                      <Badge
                        status={
                          Number(p.stock) === 0
                            ? "out"
                            : Number(p.stock) <= threshold
                              ? "low"
                              : "active"
                        }
                      />
                    </td>
                    <td>
                      <StockForm id={Number(p.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No products in this view"
            description="Try a different filter or add a new product."
          />
        )}
        <Pagination
          page={page}
          total={Number(total.n)}
          base="/admin/inventory"
          params={{ q: query, filter }}
        />
      </section>
      <section className="a-card mt-6">
        <SectionHead
          title="Inventory history"
          description="Stock received, manual adjustments and order movements."
        />
        {movements.length ? (
          <div className="a-table-scroll">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Change</th>
                  <th>Reason</th>
                  <th>Order</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={String(m.id)}>
                    <td>{String(m.product_title)}</td>
                    <td>
                      <span
                        className={
                          Number(m.delta) > 0 ? "a-positive" : "a-negative"
                        }
                      >
                        {Number(m.delta) > 0 ? "+" : ""}
                        {count(m.delta)}
                      </span>
                    </td>
                    <td>{String(m.reason)}</td>
                    <td>
                      {m.order_id ? (
                        <Link href={`/admin/orders/${m.order_id}`}>
                          #{String(m.order_id)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{date(m.created_at, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="A clean inventory history"
            description="Every stock movement from now on will be recorded here."
          />
        )}
      </section>
    </>
  );
}
