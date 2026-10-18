import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  PackageOpen,
  Plus,
} from "lucide-react";
import type { Row } from "@/lib/admin/db";
export function money(paise: unknown) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(paise ?? 0) / 100);
}
export function date(value: unknown, full = false) {
  return new Date(String(value)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    ...(full ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  });
}
export function count(value: unknown) {
  return Number(value ?? 0).toLocaleString("en-IN");
}
export function Badge({ status }: { status: unknown }) {
  const s = String(status ?? "unknown");
  return (
    <span className={`a-badge a-status-${s}`}>
      <i />
      {s.replaceAll("_", " ")}
    </span>
  );
}
export function Heading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="a-heading">
      <div>
        {eyebrow && <p className="a-eyebrow">{eyebrow}</p>}
        <h1>
          {title}
          <span className="a-heading-dot">.</span>
        </h1>
        {description && <p className="a-description">{description}</p>}
      </div>
      <div className="a-heading-actions">{children}</div>
    </div>
  );
}
export function ExportButton({ type, days }: { type: string; days?: number }) {
  return (
    <a
      className="a-button a-secondary"
      href={`/api/admin/export?type=${type}${days ? `&days=${days}` : ""}`}
    >
      <Download size={15} />
      Export CSV
    </a>
  );
}
export function AddProduct() {
  return (
    <Link href="/admin/products/new" className="a-button">
      <Plus size={17} />
      Add product
    </Link>
  );
}
export function Empty({
  title = "Nothing here yet",
  description = "New activity will appear here.",
  href,
  label,
}: {
  title?: string;
  description?: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="a-empty">
      <span>
        <PackageOpen size={27} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && (
        <Link className="a-button a-secondary" href={href}>
          {label ?? "Get started"}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
  icon,
  change,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: React.ReactNode;
  change?: number | null;
}) {
  return (
    <div className="a-metric">
      <div className="a-metric-top">
        <span>{label}</span>
        <span className="a-metric-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <div className="a-metric-bottom">
        {change != null && (
          <span className={change >= 0 ? "a-positive" : "a-negative"}>
            {change >= 0 ? (
              <ArrowUpRight size={13} />
            ) : (
              <ArrowDownLeft size={13} />
            )}{" "}
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
        <span>{detail ?? "All time"}</span>
      </div>
    </div>
  );
}
export function Pagination({
  page,
  total,
  pageSize = 20,
  base,
  params = {},
}: {
  page: number;
  total: number;
  pageSize?: number;
  base: string;
  params?: Record<string, string>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) =>
    `${base}?${new URLSearchParams({ ...params, page: String(p) })}`;
  return (
    <div className="a-pagination">
      <p>
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${count(total)}`
          : "0 results"}
      </p>
      <div>
        {page > 1 && (
          <Link href={href(page - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </Link>
        )}
        <span>
          Page {page} of {pages}
        </span>
        {page < pages && (
          <Link href={href(page + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
export function OrdersTable({ rows }: { rows: Row[] }) {
  return rows.length ? (
    <div className="a-table-scroll">
      <table className="a-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Date</th>
            <th>Payment</th>
            <th>Status</th>
            <th className="a-right">Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={String(o.id)}>
              <td>
                <Link className="a-order-ref" href={`/admin/orders/${o.id}`}>
                  {String(o.reference)}
                </Link>
              </td>
              <td>
                <div className="a-customer-cell">
                  <span className="a-avatar">
                    {String(o.customer_name)
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <span>
                    <strong>{String(o.customer_name)}</strong>
                    <small>{String(o.email)}</small>
                  </span>
                </div>
              </td>
              <td>
                <span className="a-cell-title">
                  {String(o.item_summary ?? `${o.item_count ?? 0} items`)}
                </span>
                <small className="a-block a-subtle">
                  {count(o.item_count)} units
                </small>
              </td>
              <td className="a-nowrap">{date(o.placed_at)}</td>
              <td>
                <Badge status={o.payment_status} />
              </td>
              <td>
                <Badge status={o.status} />
              </td>
              <td className="a-right a-amount">{money(o.total_paise)}</td>
              <td>
                <Link
                  href={`/admin/orders/${o.id}`}
                  aria-label={`View ${o.reference}`}
                  className="a-row-link"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="Your first order starts here"
      description="Orders placed through your storefront will appear here with customer and product details."
      href="/"
      label="View storefront"
    />
  );
}
export function SectionHead({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="a-card-head">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}
