"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Star, Plus } from "lucide-react";
import { formatINR, inr, mrp, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { revealItem } from "./Reveal";

export function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="flex">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={size}
            className={
              i < Math.round(rating)
                ? "fill-flame text-flame"
                : "text-white/20"
            }
          />
        ))}
      </span>
      <span className="text-[11px] font-medium text-haze">{rating.toFixed(1)}</span>
    </span>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  const price = inr(product.price);
  const was = mrp(product);
  const off = Math.round(product.discountPercentage);

  // Pointer-tracked 3D tilt. Springs keep it from snapping back hard on exit.
  const rx = useSpring(useMotionValue(0), { stiffness: 260, damping: 20 });
  const ry = useSpring(useMotionValue(0), { stiffness: 260, damping: 20 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glow = useMotionTemplate`radial-gradient(18rem 18rem at ${gx}% ${gy}%, rgba(242,101,34,0.22), transparent 65%)`;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 12);
    rx.set((0.5 - py) * 12);
    gx.set(px * 100);
    gy.set(py * 100);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      variants={revealItem}
      custom={index}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      className="group relative"
    >
      <Link
        href={`/product/${product.id}`}
        className="glass relative block overflow-hidden rounded-2xl transition-colors duration-300 hover:border-flame/40"
      >
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
            className="object-contain p-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />

          {off > 0 && (
            <span className="absolute left-2.5 top-2.5 z-20 rounded-full bg-flame px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-flame/30">
              {off}% OFF
            </span>
          )}

          {product.stock < 20 && (
            <span className="absolute right-2.5 top-2.5 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-flame-2 backdrop-blur">
              {product.stock} left
            </span>
          )}

          {/* quick-add, slides up on hover */}
          <motion.button
            type="button"
            aria-label={`Add ${product.title} to cart`}
            onClick={(e) => {
              e.preventDefault();
              add(product.id);
            }}
            whileTap={{ scale: 0.9 }}
            className="absolute bottom-2.5 right-2.5 z-20 flex h-9 w-9 translate-y-3 items-center justify-center rounded-full bg-flame text-white opacity-0 shadow-lg shadow-flame/40 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-flame-2"
          >
            <Plus size={17} strokeWidth={2.6} />
          </motion.button>
        </div>

        <div className="relative z-20 space-y-1.5 p-3.5">
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
      </Link>
    </motion.div>
  );
}
