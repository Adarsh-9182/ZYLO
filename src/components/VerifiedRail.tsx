"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck, ChevronLeft, ChevronRight, Plus,
  Gem, Feather, ShieldCheck, Gift, Sparkles, Link as LinkIcon, Clock, Heart,
  Shirt, Grid3x3, Users, Cloud, Palette, Armchair, Camera,
  Citrus, Droplet, Leaf, Sun, Utensils, Hand, type LucideIcon,
} from "lucide-react";
import type { Product } from "@/lib/format";
import { formatINR, inr, mrp } from "@/lib/format";
import type { Creative } from "@/data/creative";
import { useCart } from "@/lib/cart";
import { Reveal } from "./Reveal";

/**
 * Poster icons, resolved by name.
 *
 * The creative names its icons as strings because it is data — it is written
 * once per product and stored, and a stored component reference is not a
 * thing. An unknown name falls back to the seal rather than throwing: a
 * missing icon should cost a glyph, not the whole home page.
 */
const ICONS: Record<string, LucideIcon> = {
  Gem, Feather, ShieldCheck, Gift, Sparkles, Link: LinkIcon, Clock, Heart,
  Shirt, Grid3x3, Users, Cloud, Palette, Armchair, Camera,
  Citrus, Droplet, Leaf, Sun, Utensils, Hand,
};
const icon = (name: string) => ICONS[name] ?? BadgeCheck;

/**
 * One product, presented the way it was designed.
 *
 * The rest of the shop shows a cut-out on a card because that is what sourced
 * catalog data is: a photograph and a title. These five have a poster, so the
 * poster is the card — cropped to nothing, sat on a mount tinted with the
 * product's own accent, and left to do the work it was made for.
 */
function PosterCard({ product }: { product: Product }) {
  const { add } = useCart();
  const creative = product.creative as Creative | null;
  const accent = creative?.accent ?? "#f26522";
  const price = inr(product.price);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="group relative w-[248px] shrink-0 snap-start sm:w-[280px]"
    >
      <Link href={`/product/${product.id}`} className="block">
        <div
          className="relative flex h-[352px] items-center justify-center overflow-hidden rounded-[20px] border border-white/10 sm:h-[392px]"
          style={{ background: `linear-gradient(160deg, ${accent}26, transparent 62%)` }}
        >
          {/* Contained, not cropped. These are posters: the headline is part
              of the product, and object-cover would cut it off. The accent
              mount fills whatever the artwork's ratio leaves over. */}
          <Image
            src={product.thumbnail}
            alt={product.title}
            width={560}
            height={747}
            sizes="(max-width: 640px) 248px, 280px"
            className="h-full w-full object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
          <span
            className="pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset transition-opacity duration-300 group-hover:opacity-100"
            style={{ boxShadow: `inset 0 0 0 1px ${accent}55` }}
          />
        </div>
      </Link>

      <div className="mt-3.5 flex flex-col px-0.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2.6em] text-[13.5px] font-semibold leading-snug text-white transition-colors hover:text-flame">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-extrabold text-white">{formatINR(price)}</span>
            <span className="text-[11.5px] text-haze line-through">{formatINR(mrp(product))}</span>
          </div>

          <button
            onClick={() => add(product)}
            aria-label={`Add ${product.title} to cart`}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink transition-transform hover:scale-110 active:scale-95"
            style={{ background: accent }}
          >
            <Plus size={16} strokeWidth={2.6} />
          </button>
        </div>

        {creative && (
          <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
            {creative.features.slice(0, 3).map((f) => {
              const Icon = icon(f.icon);
              return (
                <li key={f.label} className="flex items-center gap-1.5 text-[10.5px] text-haze">
                  <Icon size={11} style={{ color: accent }} />
                  {f.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.article>
  );
}

export function VerifiedRail({ products }: { products: Product[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const nudge = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * 600, behavior: "smooth" });

  if (products.length === 0) return null;

  return (
    <section className="relative py-12">
      {/* A warm wash under this band only. The shop is cold navy; these five
          are photographed on cream, and dropping them straight onto the dark
          made them read as five unrelated posters rather than one shelf. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(242,101,34,0.10),transparent_70%)]"
      />

      <Reveal className="relative mb-6 flex items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-flame">
            <BadgeCheck size={14} strokeWidth={2.6} />
            Zylo Verified
          </p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Made by us
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-haze">
            Five products we source, photograph and stand behind ourselves — everything
            else on this page is catalog.
          </p>
        </div>

        <div className="hidden shrink-0 gap-2 sm:flex">
          {([-1, 1] as const).map((dir) => (
            <button
              key={dir}
              onClick={() => nudge(dir)}
              aria-label={dir === -1 ? "Scroll left" : "Scroll right"}
              className="glass flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:border-flame/50 hover:text-flame"
            >
              {dir === -1 ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
            </button>
          ))}
        </div>
      </Reveal>

      <div
        ref={scroller}
        className="relative flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-2 [scrollbar-width:none] sm:scroll-pl-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <PosterCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
