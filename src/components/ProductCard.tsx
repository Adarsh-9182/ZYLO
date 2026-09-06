"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import { formatINR, inr, mrp, type Product } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { revealItem } from "./Reveal";

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.round(rating) ? "fill-flame text-flame" : "text-white/20"}
          />
        ))}
      </span>
      <span className="text-[11px] font-medium text-haze">
        <span className="sr-only">Rated </span>
        {rating.toFixed(1)}
        <span className="sr-only"> out of 5</span>
      </span>
    </span>
  );
}

export function ProductCard({
  product,
  className = "",
}: {
  product: Product;
  className?: string;
}) {
  const { add } = useCart();
  const price = inr(product.price);
  const was = mrp(product);
  const off = Math.round(product.discountPercentage);
  const soldOut = product.stock === 0;

  // Raw pointer values drive the springs. Setting a spring's own value does
  // nothing when it was created from a source, so the source is what we set.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rx = useSpring(tiltX, { stiffness: 260, damping: 20 });
  const ry = useSpring(tiltY, { stiffness: 260, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(18rem 18rem at ${gx}% ${gy}%, rgba(242,101,34,0.22), transparent 65%)`;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    tiltY.set((px - 0.5) * 12);
    tiltX.set((0.5 - py) * 12);
    gx.set(px * 100);
    gy.set(py * 100);
  }

  function onLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <motion.div
      variants={revealItem}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className={`group relative ${className}`}
    >
      <div className="glass relative overflow-hidden rounded-2xl transition-colors duration-300 group-hover:border-flame/40">
        {/* cursor-following glow */}
        <motion.span
          aria-hidden
          style={{ background: glow }}
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />

        <div className="relative aspect-square overflow-hidden bg-white/[0.03]">
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className={`object-contain p-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 ${
              soldOut ? "opacity-40 grayscale" : ""
            }`}
          />

          {off > 0 && (
            <span className="absolute left-2.5 top-2.5 z-20 rounded-full bg-flame px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-flame/30">
              {off}% OFF
            </span>
          )}

          {soldOut ? (
            <span className="absolute right-2.5 top-2.5 z-30 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              Sold out
            </span>
          ) : (
            product.stock < 20 && (
              <span className="absolute right-2.5 top-2.5 z-30 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-flame-2 backdrop-blur">
                {product.stock} left
              </span>
            )
          )}

          {/* Sits above the card-wide link overlay so it stays clickable, and
              is a sibling of it rather than nested inside an anchor. */}
          {!soldOut && (
            <motion.button
              type="button"
              aria-label={`Add ${product.title} to cart`}
              onClick={() => add(product)}
              whileTap={{ scale: 0.9 }}
              className="absolute bottom-2.5 right-2.5 z-30 flex h-9 w-9 translate-y-3 items-center justify-center rounded-full bg-flame text-white opacity-0 shadow-lg shadow-flame/40 transition-all duration-300 hover:bg-flame-2 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
            >
              <Plus size={17} strokeWidth={2.6} />
            </motion.button>
          )}
        </div>

        <div className="relative space-y-1.5 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-haze">
            {product.brand ?? product.category}
          </p>
          <h3 className="line-clamp-1 text-sm font-semibold text-white">
            {product.title}
          </h3>
          <Stars rating={product.rating} />
          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-base font-bold text-white">{formatINR(price)}</span>
            {off > 0 && (
              <span className="text-xs text-haze line-through">{formatINR(was)}</span>
            )}
          </div>
        </div>

        {/* One link covering the whole card keeps the markup valid and the
            entire surface clickable. */}
        <Link
          href={`/product/${product.id}`}
          aria-label={product.title}
          className="absolute inset-0 z-20 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
        />
      </div>
    </motion.div>
  );
}
