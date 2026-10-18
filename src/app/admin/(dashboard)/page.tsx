import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  Package,
  ShoppingBag,
  TriangleAlert,
  Users,
} from "lucide-react";
import {
  AddProduct,
  count,
  ExportButton,
  Heading,
  Metric,
  money,
  OrdersTable,
  SectionHead,
  Empty,
} from "@/components/admin/UI";
import { SalesChart } from "@/components/admin/Charts";
import { dashboardData, growth, period } from "@/lib/admin/queries";
export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const days = period((await searchParams).days);
  const {
    metrics: m,
    previous: p,
    chart,
    top,
    stock,
    recent,
  } = await dashboardData(days);
  const maxUnits = Math.max(...top.map((t) => Number(t.units)), 1);
  return (
    <>
      <Heading
        eyebrow="A LITTLE CLARITY FOR YOUR NEXT BIG MOVE"
        title="Your store at a glance"
        description="Good to see you. Here’s what’s happening with your business."
      >
        <ExportButton type="orders" days={days} />
        <AddProduct />
      </Heading>
      <div className="a-metrics">
        <Metric
          label="Total sales"
          value={money(m.sales)}
          detail={`vs previous ${days} days`}
          change={growth(m.sales, p.sales)}
          icon={<CircleDollarSign />}
        />
        <Metric
          label="Orders received"
          value={count(m.orders)}
          detail={`Last ${days} days`}
          change={growth(m.orders, p.orders)}
          icon={<ShoppingBag />}
        />
        <Metric
          label="Customers"
          value={count(m.customers)}
          detail="Unique customer emails"
          change={growth(m.customers, p.customers)}
          icon={<Users />}
        />
        <Metric
          label="Active products"
          value={count(stock.active)}
          detail={`${count(stock.units)} units in inventory`}
          icon={<Package />}
        />
      </div>
      {Number(stock.low) > 0 && (
        <div className="a-attention">
          <TriangleAlert size={20} />
          <div>
            <strong>{count(stock.low)} products need a stock check</strong>
            <p>
              {count(stock.out)} out of stock. Keep your bestsellers ready for
              their next customer.
            </p>
          </div>
          <Link href="/admin/inventory?filter=low">
            Review stock
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
      <div className="a-two-col">
        <section className="a-card">
          <SectionHead
            title="Sales overview"
            description="Every order, a little more momentum."
          >
            <form className="a-period-form">
              <select aria-label="Sales period" name="days" defaultValue={days}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
              <button className="a-button a-secondary a-small">Apply</button>
            </form>
          </SectionHead>
          <SalesChart rows={chart} />
        </section>
        <section className="a-card">
          <SectionHead
            title="Top products"
            description="The things your customers are loving."
          >
            <Link href="/admin/analytics">
              View report
              <ArrowUpRight size={13} />
            </Link>
          </SectionHead>
          {top.length ? (
            <div className="a-product-list">
              {top.map((t) => (
                <Link
                  key={String(t.product_id)}
                  href={`/admin/products/${t.product_id}`}
                  className="a-product-row"
                >
                  <Image
                    unoptimized
                    width={480}
                    height={400}
                    className="a-thumb"
                    src={String(t.thumbnail)}
                    alt=""
                  />
                  <div>
                    <strong>{String(t.title)}</strong>
                    <small>{count(t.units)} units sold</small>
                    <div className="a-product-progress">
                      <i
                        style={{
                          width: `${(Number(t.units) / maxUnits) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <b>{money(t.sales)}</b>
                </Link>
              ))}
            </div>
          ) : (
            <Empty
              title="Your future bestsellers"
              description="Once customers start ordering, your most popular products will appear here."
            />
          )}
        </section>
      </div>
      <section className="a-card">
        <SectionHead
          title="Recent orders"
          description="The latest from your storefront."
        >
          <Link href="/admin/orders">
            View all orders
            <ArrowUpRight size={13} />
          </Link>
        </SectionHead>
        <OrdersTable rows={recent} />
      </section>
      <div className="a-detail-grid mt-5">
        <section className="a-card">
          <SectionHead title="Fulfillment snapshot" />
          <div className="a-inline-metrics">
            <div>
              <strong>{count(m.to_fulfill)}</strong>
              <span>Orders to prepare</span>
            </div>
            <div>
              <strong>{money(m.outstanding)}</strong>
              <span>COD to collect</span>
            </div>
            <div>
              <strong>{count(m.returned)}</strong>
              <span>Returned orders</span>
            </div>
          </div>
        </section>
        <section className="a-card">
          <SectionHead
            title="Cash collected"
            description="Payments you’ve marked as paid in this period."
          />
          <div className="a-inline-metrics">
            <div>
              <strong>{money(m.collected)}</strong>
              <span>Collected · separate from booked sales</span>
            </div>
            <div>
              <strong>
                {Number(m.valid_orders)
                  ? money(Number(m.sales) / Number(m.valid_orders))
                  : money(0)}
              </strong>
              <span>Avg. order value · see analytics</span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
