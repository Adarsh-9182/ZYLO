import Link from "next/link";
import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { pageNumber } from "@/lib/admin/queries";
import {
  count,
  date,
  Empty,
  ExportButton,
  Heading,
  money,
  Pagination,
} from "@/components/admin/UI";
export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireOwner();
  const { q = "", page: raw } = await searchParams;
  const page = pageNumber(raw),
    query = q.slice(0, 200),
    like = `%${query}%`,
    sql = adminSql();
  const [rows, [total]] = await Promise.all([
    sql`SELECT lower(email) AS email,(array_agg(customer_name ORDER BY placed_at DESC))[1] AS name,(array_agg(phone ORDER BY placed_at DESC))[1] AS phone,(array_agg(city ORDER BY placed_at DESC))[1] AS city,count(*)::int AS orders,coalesce(sum(total_paise) FILTER(WHERE status NOT IN ('cancelled','returned')),0)::bigint AS spent,max(placed_at) AS last_order FROM orders GROUP BY lower(email) HAVING (${query}='' OR lower(email) ILIKE ${like} OR bool_or(customer_name ILIKE ${like} OR phone ILIKE ${like})) ORDER BY last_order DESC LIMIT 20 OFFSET ${(page - 1) * 20}`,
    sql`SELECT count(*)::int AS n FROM (SELECT lower(email) FROM orders GROUP BY lower(email) HAVING (${query}='' OR lower(email) ILIKE ${like} OR bool_or(customer_name ILIKE ${like} OR phone ILIKE ${like}))) c`,
  ]);
  return (
    <>
      <Heading
        eyebrow="THE PEOPLE BEHIND EVERY ORDER"
        title="Customers"
        description="Every customer, their order history and the products they come back for."
      >
        <ExportButton type="customers" />
      </Heading>
      <section className="a-card">
        <div className="a-table-tools">
          <span className="a-subtle">
            {count(total.n)} customers · grouped by email address
          </span>
          <form className="a-filter">
            <input
              name="q"
              defaultValue={query}
              placeholder="Name, email or phone…"
              aria-label="Search customers"
            />
            <button className="a-button a-secondary a-small">Search</button>
          </form>
        </div>
        {rows.length ? (
          <div className="a-table-scroll">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Orders</th>
                  <th>Total ordered</th>
                  <th>Last order</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={String(c.email)}>
                    <td>
                      <Link
                        className="a-customer-cell"
                        href={`/admin/customers/profile?email=${encodeURIComponent(String(c.email))}`}
                      >
                        <span className="a-avatar">
                          {String(c.name).slice(0, 2)}
                        </span>
                        <span>
                          <strong>{String(c.name)}</strong>
                          <small>{String(c.email)}</small>
                        </span>
                      </Link>
                    </td>
                    <td>{String(c.phone)}</td>
                    <td>{String(c.city)}</td>
                    <td>{count(c.orders)}</td>
                    <td className="a-amount">{money(c.spent)}</td>
                    <td>{date(c.last_order, true)}</td>
                    <td>
                      <Link
                        className="a-text-button"
                        href={`/admin/customers/profile?email=${encodeURIComponent(String(c.email))}`}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Meet your future customers"
            description="When someone orders, their contact details and buying history will appear here."
          />
        )}
        <Pagination
          page={page}
          total={Number(total.n)}
          base="/admin/customers"
          params={{ q: query }}
        />
      </section>
    </>
  );
}
