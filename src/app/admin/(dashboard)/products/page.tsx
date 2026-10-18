import Image from "next/image";
import Link from "next/link";
import { desc, eq, and, ilike, or, sql as dsql } from "drizzle-orm";
import { requireOwner } from "@/lib/admin/auth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { pageNumber } from "@/lib/admin/queries";
import {
  AddProduct,
  Badge,
  count,
  Empty,
  ExportButton,
  Heading,
  money,
  Pagination,
} from "@/components/admin/UI";
import { VisibilityForm } from "@/components/admin/Forms";
export default async function Products({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    filter?: string;
    page?: string;
    saved?: string;
  }>;
}) {
  await requireOwner();
  const { q = "", filter = "all", page: raw, saved } = await searchParams;
  const page = pageNumber(raw),
    query = q.slice(0, 200),
    like = `%${query}%`;
  const conditions = and(
    query
      ? or(
          ilike(products.title, like),
          ilike(products.sku, like),
          ilike(products.category, like),
        )
      : undefined,
    filter === "active"
      ? eq(products.active, true)
      : filter === "archived"
        ? eq(products.active, false)
        : undefined,
  );
  const [rows, [total], summary] = await Promise.all([
    db
      .select()
      .from(products)
      .where(conditions)
      .orderBy(desc(products.id))
      .limit(20)
      .offset((page - 1) * 20),
    db
      .select({ n: dsql<number>`count(*)::int` })
      .from(products)
      .where(conditions),
    db
      .select({ active: products.active, n: dsql<number>`count(*)::int` })
      .from(products)
      .groupBy(products.active),
  ]);
  const all = summary.reduce((s, r) => s + r.n, 0),
    active = summary.find((r) => r.active)?.n ?? 0;
  return (
    <>
      <Heading
        eyebrow="YOUR CATALOG, YOUR CALL"
        title="Products"
        description="Everything you sell, ready for its next customer."
      >
        <ExportButton type="products" />
        <AddProduct />
      </Heading>
      {saved && (
        <p className="a-notice a-success" role="status">
          Product saved. Your storefront has been updated.
        </p>
      )}
      <section className="a-card">
        <div className="a-table-tools">
          <nav className="a-tabs" aria-label="Product visibility">
            {[
              ["all", `All products (${all})`],
              ["active", `Published (${active})`],
              ["archived", `Archived (${all - active})`],
            ].map(([key, label]) => (
              <Link
                key={key}
                href={`/admin/products?filter=${key}`}
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
              placeholder="Search product, SKU, category…"
              aria-label="Search products"
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
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Inventory</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="a-customer-cell"
                      >
                        <Image
                          unoptimized
                          width={480}
                          height={400}
                          src={p.thumbnail}
                          alt=""
                          className="a-thumb"
                        />
                        <span>
                          <strong>{p.title}</strong>
                          <small>{p.brand ?? "Zylo collection"}</small>
                        </span>
                      </Link>
                    </td>
                    <td>{p.sku ?? "—"}</td>
                    <td>{p.category.replaceAll("-", " ")}</td>
                    <td className="a-amount">
                      {money(Math.round(p.price * 84) * 100)}
                    </td>
                    <td>{count(p.stock)} in stock</td>
                    <td>
                      <Badge status={p.active ? "published" : "archived"} />
                    </td>
                    <td>
                      <div className="flex items-center gap-4">
                        <Link
                          className="a-text-button"
                          href={`/admin/products/${p.id}`}
                        >
                          Edit
                        </Link>
                        <VisibilityForm
                          id={p.id}
                          version={p.version}
                          active={p.active}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No products found"
            description={
              query
                ? "Try a different search or clear your filters."
                : "Add your first product with a price, images and opening stock."
            }
            href="/admin/products/new"
            label="Add product"
          />
        )}
        <Pagination
          page={page}
          total={total.n}
          base="/admin/products"
          params={{ q: query, filter }}
        />
      </section>
    </>
  );
}
