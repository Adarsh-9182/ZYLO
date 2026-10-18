import Image from "next/image";
import Link from "next/link";
import { CircleDollarSign, RotateCcw, ShoppingBag, Wallet } from "lucide-react";
import { dashboardData, period } from "@/lib/admin/queries";
import { SalesChart } from "@/components/admin/Charts";
import {
  count,
  Empty,
  ExportButton,
  Heading,
  Metric,
  money,
  SectionHead,
} from "@/components/admin/UI";
export default async function Analytics({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const days = period((await searchParams).days);
  const { metrics: m, chart, top, statuses } = await dashboardData(days);
  const cancelled = Number(
      statuses.find((s) => s.status === "cancelled")?.count ?? 0,
    ),
    valid = Number(m.orders) - Number(m.returned) - cancelled;
  return (
    <>
      <Heading
        eyebrow="LESS GUESSWORK. MORE DIRECTION."
        title="Analytics"
        description="Understand your sales, collections and best-performing products."
      >
        <form className="a-period-form">
          <select aria-label="Report period" name="days" defaultValue={days}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button className="a-button a-secondary">Apply</button>
        </form>
        <ExportButton type="orders" days={days} />
      </Heading>
      <div className="a-metrics">
        <Metric
          label="Order sales"
          value={money(m.sales)}
          detail="Excludes cancellations & returns"
          icon={<CircleDollarSign />}
        />
        <Metric
          label="Cash collected"
          value={money(m.collected)}
          detail="Payments marked as paid"
          icon={<Wallet />}
        />
        <Metric
          label="Average order value"
          value={money(valid ? Number(m.sales) / valid : 0)}
          detail={`${count(valid)} non-cancelled, non-returned orders`}
          icon={<ShoppingBag />}
        />
        <Metric
          label="Return rate"
          value={`${Number(m.orders) ? ((Number(m.returned) / Number(m.orders)) * 100).toFixed(1) : "0"}%`}
          detail={`${count(m.returned)} of ${count(m.orders)} orders`}
          icon={<RotateCcw />}
        />
      </div>
      <div className="a-two-col">
        <section className="a-card">
          <SectionHead
            title="Sales over time"
            description={`Daily sales · last ${days} days · India Standard Time`}
          />
          <SalesChart rows={chart} />
        </section>
        <section className="a-card">
          <SectionHead
            title="Order status breakdown"
            description={`${count(m.orders)} total orders in this period`}
          />
          {statuses.length ? (
            <div className="a-analytics-breakdown">
              {statuses.map((s) => (
                <div key={String(s.status)}>
                  <div>
                    <span className="capitalize">{String(s.status)}</span>
                    <span>{count(s.count)} orders</span>
                  </div>
                  <div className="a-status-meter">
                    <i
                      style={{
                        width: `${(Number(s.count) / Number(m.orders)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="Your next chapter, in numbers"
              description="As orders come in, see how they move through your store."
            />
          )}
        </section>
      </div>
      <section className="a-card">
        <SectionHead
          title="Product performance"
          description="Ranked by sales. Cancelled and returned orders excluded."
        />
        {top.length ? (
          <div className="a-table-scroll">
            <table className="a-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Units sold</th>
                  <th className="a-right">Sales</th>
                </tr>
              </thead>
              <tbody>
                {top.map((p) => (
                  <tr key={String(p.product_id)}>
                    <td>
                      <Link
                        className="a-customer-cell"
                        href={`/admin/products/${p.product_id}`}
                      >
                        <Image
                          unoptimized
                          width={480}
                          height={400}
                          src={String(p.thumbnail)}
                          className="a-thumb"
                          alt=""
                        />
                        <strong>{String(p.title)}</strong>
                      </Link>
                    </td>
                    <td>{count(p.units)}</td>
                    <td className="a-right a-amount">{money(p.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Your next bestseller is waiting"
            description="Product sales will be ranked here once you receive orders."
          />
        )}
      </section>
    </>
  );
}
