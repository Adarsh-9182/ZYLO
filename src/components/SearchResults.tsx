"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import {
  categories,
  categoryLabel,
  formatINR,
  inr,
  products,
  search,
  sortProducts,
  type SortKey,
} from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { RevealGroup } from "./Reveal";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Relevance" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "rating", label: "Customer rating" },
  { key: "discount", label: "Biggest discount" },
];

const MAX_PRICE = 168000; // ~$2000 scaled to rupees, above the priciest item

export function SearchResults({
  query,
  initialCategory,
  initialSort,
}: {
  query: string;
  initialCategory: string;
  initialSort: SortKey;
}) {
  const [cats, setCats] = useState<string[]>(initialCategory ? [initialCategory] : []);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [minRating, setMinRating] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const base = query ? search(query) : products;

  const results = useMemo(() => {
    const filtered = base.filter(
      (p) =>
        (cats.length === 0 || cats.includes(p.category)) &&
        inr(p.price) <= maxPrice &&
        p.rating >= minRating
    );
    return sortProducts(filtered, sort);
  }, [base, cats, maxPrice, minRating, sort]);

  function toggleCat(c: string) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function reset() {
    setCats([]);
    setMaxPrice(MAX_PRICE);
    setMinRating(0);
    setSort("relevance");
  }

  const activeCount =
    cats.length + (maxPrice < MAX_PRICE ? 1 : 0) + (minRating > 0 ? 1 : 0);

  const filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          Category
        </h3>
        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {categories.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-haze transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              <input
                type="checkbox"
                checked={cats.includes(c)}
                onChange={() => toggleCat(c)}
                className="h-3.5 w-3.5 accent-[var(--color-flame)]"
              />
              {categoryLabel(c)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          Max price
        </h3>
        <input
          type="range"
          min={500}
          max={MAX_PRICE}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[var(--color-flame)]"
        />
        <p className="mt-1.5 text-sm font-semibold text-flame">
          Up to {formatINR(maxPrice)}
        </p>
      </div>

      <div>
        <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
          Rating
        </h3>
        <div className="flex flex-wrap gap-2">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                minRating === r
                  ? "bg-flame text-white"
                  : "glass text-haze hover:text-white"
              }`}
            >
              {r === 0 ? "Any" : `${r}★ & up`}
            </button>
          ))}
        </div>
      </div>

      {activeCount > 0 && (
        <button
          onClick={reset}
          className="text-xs font-semibold text-flame hover:text-flame-2"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {query ? (
            <>
              Results for <span className="text-gradient">“{query}”</span>
            </>
          ) : cats.length === 1 ? (
            categoryLabel(cats[0])
          ) : (
            "All products"
          )}
        </h1>
        <p className="mt-1 text-sm text-haze">
          {results.length} {results.length === 1 ? "item" : "items"}
        </p>
      </div>

      <div className="flex gap-8">
        {/* desktop filter column */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-32">{filters}</div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              onClick={() => setFiltersOpen(true)}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white lg:hidden"
            >
              <SlidersHorizontal size={14} />
              Filters
              {activeCount > 0 && (
                <span className="rounded-full bg-flame px-1.5 text-[10px]">
                  {activeCount}
                </span>
              )}
            </button>

            <div className="no-scrollbar ml-auto flex gap-2 overflow-x-auto">
              {SORTS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSort(s.key)}
                  className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    sort === s.key
                      ? "bg-flame text-white"
                      : "glass text-haze hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {results.length === 0 ? (
            <div className="glass flex flex-col items-center gap-3 rounded-2xl py-20 text-center">
              <p className="text-sm text-haze">
                Nothing matched. Try widening the filters.
              </p>
              <button
                onClick={reset}
                className="rounded-full bg-flame px-5 py-2 text-sm font-semibold text-white"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <RevealGroup
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
              stagger={0.03}
            >
              {results.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </RevealGroup>
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="fixed bottom-0 left-0 right-0 z-[70] max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-white/10 bg-ink-2 p-6 lg:hidden"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-white">
                  Filters
                </h2>
                <button onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                  <X size={18} className="text-haze" />
                </button>
              </div>
              {filters}
              <button
                onClick={() => setFiltersOpen(false)}
                className="mt-7 w-full rounded-full bg-flame py-3 text-sm font-bold text-white"
              >
                Show {results.length} results
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
