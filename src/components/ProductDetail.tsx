"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Check,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";
import {
  categoryLabel,
  formatINR,
  inr,
  mrp,
  type Product,
} from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { Stars } from "./ProductCard";
import { Reveal } from "./Reveal";

export function ProductDetail({ product }: { product: Product }) {
  const { add } = useCart();
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });

  const price = inr(product.price);
  const was = mrp(product);
  const off = Math.round(product.discountPercentage);
  const soldOut = product.stock === 0;
  const gallery = product.images.length > 0 ? product.images : [product.thumbnail];

  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: product.reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const totalReviews = product.reviews.length || 1;

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-haze">
        <Link href="/" className="hover:text-flame">
          Home
        </Link>
        <ChevronRight size={13} />
        <Link href={`/search?category=${product.category}`} className="hover:text-flame">
          {categoryLabel(product.category)}
        </Link>
        <ChevronRight size={13} />
        <span className="truncate text-white/70">{product.title}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr_20rem]">
        {/* gallery */}
        <div className="flex gap-3">
          {gallery.length > 1 && (
            <div className="flex w-16 shrink-0 flex-col gap-2">
              {gallery.map((src, i) => (
                <button
                  key={src}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`relative aspect-square overflow-hidden rounded-xl border transition-colors ${
                    active === i
                      ? "border-flame"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="64px"
                    className="bg-white/[0.03] object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}

          <div
            onMouseEnter={() => setZoom((z) => ({ ...z, on: true }))}
            onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({
                on: true,
                x: ((e.clientX - r.left) / r.width) * 100,
                y: ((e.clientY - r.top) / r.height) * 100,
              });
            }}
            className="glass relative aspect-square flex-1 overflow-hidden rounded-3xl"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                <Image
                  src={gallery[active]}
                  alt={product.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  style={{
                    transform: zoom.on ? "scale(1.75)" : "scale(1)",
                    transformOrigin: `${zoom.x}% ${zoom.y}%`,
                  }}
                  className="object-contain p-8 transition-transform duration-200"
                />
              </motion.div>
            </AnimatePresence>

            {off > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-flame px-2.5 py-1 text-[11px] font-bold text-white shadow-lg shadow-flame/30">
                {off}% OFF
              </span>
            )}
          </div>
        </div>

        {/* info */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-flame">
            {product.brand ?? categoryLabel(product.category)}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl">
            {product.title}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <Stars rating={product.rating} size={14} />
            <span className="text-xs text-haze">
              {product.reviews.length} ratings
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-white">
              {formatINR(price)}
            </span>
            {off > 0 && (
              <>
                <span className="text-base text-haze line-through">
                  {formatINR(was)}
                </span>
                <span className="text-sm font-bold text-flame-2">{off}% off</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-haze">Inclusive of all taxes</p>

          <p className="mt-6 text-sm leading-relaxed text-haze">
            {product.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="glass rounded-full px-3 py-1.5 text-xs text-haze transition-colors hover:border-flame/50 hover:text-white"
              >
                #{t}
              </Link>
            ))}
          </div>

          <dl className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Truck, label: product.shippingInformation },
              { icon: RotateCcw, label: product.returnPolicy },
              { icon: ShieldCheck, label: product.warrantyInformation },
              { icon: Zap, label: product.availabilityStatus },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 text-xs text-haze">
                <Icon size={15} className="shrink-0 text-flame" />
                {label}
              </div>
            ))}
          </dl>
        </div>

        {/* buy box */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <div className="glass rounded-3xl p-5">
            <p className="text-2xl font-extrabold text-white">{formatINR(price)}</p>
            <p className="mt-1 text-xs text-flame-2">
              You save {formatINR(was - price)}
            </p>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-haze">
              <Truck size={14} className="text-flame" />
              {product.shippingInformation}
            </p>

            <p
              className={`mt-3 text-sm font-semibold ${
                product.stock > 20 ? "text-emerald-400" : "text-flame"
              }`}
            >
              {product.stock > 0 ? `In stock · ${product.stock} left` : "Out of stock"}
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-haze">Qty</span>
              <div className="flex items-center gap-1 rounded-full border border-white/10 p-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="rounded-full p-1.5 text-haze transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-semibold text-white">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  aria-label="Increase quantity"
                  className="rounded-full p-1.5 text-haze transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            <motion.button
              whileHover={soldOut ? undefined : { scale: 1.02 }}
              whileTap={soldOut ? undefined : { scale: 0.97 }}
              disabled={soldOut}
              onClick={() => add(product.id, qty)}
              className="mt-5 w-full rounded-full bg-gradient-to-r from-flame to-flame-2 py-3.5 text-sm font-bold text-white shadow-lg shadow-flame/25 disabled:cursor-not-allowed disabled:from-white/15 disabled:to-white/15 disabled:text-haze disabled:shadow-none"
            >
              {soldOut ? "Out of stock" : "Add to cart"}
            </motion.button>
            <motion.button
              whileHover={soldOut ? undefined : { scale: 1.02 }}
              whileTap={soldOut ? undefined : { scale: 0.97 }}
              disabled={soldOut}
              onClick={() => add(product.id, qty)}
              className="mt-2.5 w-full rounded-full bg-white py-3.5 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-haze"
            >
              Buy now
            </motion.button>

            <ul className="mt-5 space-y-2 border-t border-white/10 pt-4">
              {["Secure payments", "COD available", "Zylo verified seller"].map((x) => (
                <li key={x} className="flex items-center gap-2 text-xs text-haze">
                  <Check size={13} className="text-flame" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* reviews */}
      <Reveal className="mt-14">
        <h2 className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
          Ratings &amp; reviews
        </h2>

        <div className="mt-5 grid gap-8 lg:grid-cols-[16rem_1fr]">
          <div className="glass rounded-2xl p-5">
            <p className="text-4xl font-extrabold text-white">
              {product.rating.toFixed(1)}
              <span className="text-lg text-haze">/5</span>
            </p>
            <div className="mt-2">
              <Stars rating={product.rating} size={14} />
            </div>
            <p className="mt-1 text-xs text-haze">
              Based on {product.reviews.length} reviews
            </p>

            <div className="mt-4 space-y-1.5">
              {breakdown.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-3 text-[11px] text-haze">{star}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(count / totalReviews) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-flame"
                    />
                  </div>
                  <span className="w-4 text-right text-[11px] text-haze">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {product.reviews.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                className="glass rounded-2xl p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {r.reviewerName}
                  </span>
                  <Stars rating={r.rating} size={12} />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-haze">{r.comment}</p>
                <p className="mt-2 text-[11px] text-haze/60">
                  {new Date(r.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </motion.li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
