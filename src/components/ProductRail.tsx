"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { Reveal, RevealGroup } from "./Reveal";

export function ProductRail({
  title,
  eyebrow,
  products,
}: {
  title: string;
  eyebrow?: string;
  products: Product[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function nudge(dir: 1 | -1) {
    scroller.current?.scrollBy({ left: dir * 640, behavior: "smooth" });
  }

  return (
    <section className="py-10">
      <Reveal className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-6">
        <div>
          {eyebrow && (
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-flame">
              {eyebrow}
            </p>
          )}
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
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

      <RevealGroup
        className="no-scrollbar flex gap-4 overflow-x-auto px-4 pb-2 sm:px-6"
        stagger={0.05}
      >
        {/* ProductCard must be a direct child: Framer Motion only propagates
            variants through motion components, so a plain wrapper div here
            would stop the stagger from ever reaching the cards. */}
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} className="w-[15rem] shrink-0" />
        ))}
      </RevealGroup>
    </section>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <RevealGroup
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      stagger={0.04}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </RevealGroup>
  );
}
