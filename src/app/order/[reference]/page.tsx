import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Package, Truck } from "lucide-react";
import { orderByReference } from "@/lib/orders";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order confirmed — Zylo",
  robots: { index: false, follow: false },
};

/** Paise on the wire, rupees on the page. */
const rupees = (paise: number) => formatINR(Math.round(paise / 100));

export default async function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const found = await orderByReference(decodeURIComponent(reference));
  if (!found) notFound();

  const { order, items } = found;
  const placed = new Date(order.placedAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="flex flex-col items-center text-center">
        <CheckCircle2 size={40} className="text-emerald-400" strokeWidth={1.6} />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Order confirmed
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-haze">
          Thanks {order.customerName.split(" ")[0]} — we have it. Keep this reference; it
          is how you or our support team can find this order.
        </p>
        <p className="mt-5 rounded-full border border-flame/40 bg-flame/10 px-5 py-2 font-mono text-lg font-bold tracking-[0.12em] text-flame-2">
          {order.reference}
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-flame">
            <Truck size={13} /> Delivering to
          </h2>
          <address className="mt-3 text-[13.5px] not-italic leading-relaxed text-white">
            {order.customerName}
            <br />
            <span className="text-haze">
              {order.addressLine}
              <br />
              {order.city}, {order.state} {order.pincode}
              <br />
              {order.phone}
            </span>
          </address>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-flame">
            <Package size={13} /> Order
          </h2>
          <dl className="mt-3 space-y-1.5 text-[13.5px]">
            <div className="flex justify-between"><dt className="text-haze">Placed</dt><dd className="text-white">{placed}</dd></div>
            <div className="flex justify-between"><dt className="text-haze">Payment</dt><dd className="text-white">Cash on delivery</dd></div>
            <div className="flex justify-between"><dt className="text-haze">Status</dt><dd className="capitalize text-emerald-400">{order.status}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                <Image src={item.thumbnail} alt={item.title} fill sizes="64px" className="object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${item.productId}`} className="line-clamp-2 text-[13.5px] font-medium leading-snug text-white hover:text-flame">
                  {item.title}
                </Link>
                <p className="mt-0.5 text-[12px] text-haze">
                  {rupees(item.unitPaise)} × {item.qty}
                </p>
              </div>
              <p className="shrink-0 text-[14px] font-bold text-white">
                {rupees(item.unitPaise * item.qty)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[13px]">
          <div className="flex justify-between text-haze">
            <dt>Subtotal</dt><dd className="text-white">{rupees(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between text-haze">
            <dt>Delivery</dt>
            <dd className={order.shippingPaise === 0 ? "text-emerald-400" : "text-white"}>
              {order.shippingPaise === 0 ? "Free" : rupees(order.shippingPaise)}
            </dd>
          </div>
          <div className="flex justify-between border-t border-white/10 pt-3 text-[16px] font-extrabold text-white">
            <dt>Total</dt><dd>{rupees(order.totalPaise)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="rounded-full bg-white px-6 py-3 text-sm font-bold text-ink transition-transform hover:scale-[1.03]">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
