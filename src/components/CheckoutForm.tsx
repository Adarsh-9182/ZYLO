"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, ShoppingBag, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/format";
import { Reveal } from "./Reveal";

/** Mirrors the server rule in lib/orders.ts. The server's answer is the real one. */
const FREE_DELIVERY = 4999;
const SHIPPING = 49;

const FIELDS = [
  { name: "customerName", label: "Full name", autoComplete: "name", placeholder: "Adarsh Bhardwaj", span: 2 },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com", span: 1 },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "tel", placeholder: "98765 43210", span: 1 },
  { name: "addressLine", label: "Address", autoComplete: "street-address", placeholder: "Flat, building, street, area", span: 2 },
  { name: "city", label: "City", autoComplete: "address-level2", placeholder: "Ludhiana", span: 1 },
  { name: "state", label: "State", autoComplete: "address-level1", placeholder: "Punjab", span: 1 },
  { name: "pincode", label: "PIN code", autoComplete: "postal-code", placeholder: "141001", span: 1, inputMode: "numeric" as const },
] as const;

export function CheckoutForm() {
  const { items, lines, subtotal, savings, clear } = useCart();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = subtotal >= FREE_DELIVERY || subtotal === 0 ? 0 : SHIPPING;
  const total = subtotal + shipping;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = { lines };
    for (const f of FIELDS) payload[f.name] = String(form.get(f.name) ?? "");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (!res || !res.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "We could not place that order. Try again in a moment.");
      setBusy(false);
      return;
    }

    const { reference } = await res.json();
    // Cleared only once the server has the order, so a failed attempt never
    // costs the shopper their basket.
    clear();
    router.push(`/order/${reference}`);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
        <ShoppingBag size={30} className="text-haze" />
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-white">
          There is nothing to check out
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-haze">
          Your cart is empty. Once you add something it will show up here with a total.
        </p>
        <Link
          href="/search"
          className="mt-7 rounded-full bg-flame px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.03]"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Reveal>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-haze transition-colors hover:text-white"
        >
          <ArrowLeft size={15} /> Keep shopping
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Checkout
        </h1>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={submit} noValidate className="order-2 lg:order-1">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-flame">
            Delivery address
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name} className={f.span === 2 ? "sm:col-span-2" : undefined}>
                <label htmlFor={f.name} className="mb-1.5 block text-[13px] font-semibold text-white">
                  {f.label}
                </label>
                <input
                  id={f.name}
                  name={f.name}
                  type={"type" in f ? f.type : "text"}
                  inputMode={"inputMode" in f ? f.inputMode : undefined}
                  autoComplete={f.autoComplete}
                  placeholder={f.placeholder}
                  required
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] text-white outline-none transition-colors placeholder:text-haze/60 focus:border-flame/60"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Truck size={17} className="mt-0.5 shrink-0 text-flame" />
            <p className="text-[13px] leading-relaxed text-haze">
              <span className="font-semibold text-white">Cash on delivery.</span> Pay the
              courier when it arrives — no card needed. Dispatch in 1–2 business days.
            </p>
          </div>

          {error && (
            <p role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-relaxed text-red-300">
              {error}
            </p>
          )}

          <motion.button
            type="submit"
            disabled={busy}
            whileHover={busy ? undefined : { scale: 1.01 }}
            whileTap={busy ? undefined : { scale: 0.99 }}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-flame to-flame-2 py-4 text-sm font-bold text-white shadow-lg shadow-flame/25 disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Placing your order…" : `Place order · ${formatINR(total)}`}
          </motion.button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-haze">
            <Lock size={11} /> Your details are used for this delivery only.
          </p>
        </form>

        {/* Summary */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-flame">
              Your order
            </h2>

            <ul className="mt-4 space-y-3.5">
              {items.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                    <Image src={product.thumbnail} alt={product.title} fill sizes="56px" className="object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[12.5px] font-medium leading-snug text-white">
                      {product.title}
                    </p>
                    <p className="mt-0.5 text-[11.5px] text-haze">Qty {qty}</p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-[13px]">
              <div className="flex justify-between text-haze">
                <dt>Subtotal</dt>
                <dd className="text-white">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-haze">
                <dt>Delivery</dt>
                <dd className={shipping === 0 ? "text-emerald-400" : "text-white"}>
                  {shipping === 0 ? "Free" : formatINR(shipping)}
                </dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-flame-2">
                  <dt>You save</dt>
                  <dd>{formatINR(savings)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-white/10 pt-3 text-[15px] font-extrabold text-white">
                <dt>Total</dt>
                <dd>{formatINR(total)}</dd>
              </div>
            </dl>

            {shipping > 0 && (
              <p className="mt-3 text-[11.5px] leading-relaxed text-haze">
                Add {formatINR(FREE_DELIVERY - subtotal)} more for free delivery.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
