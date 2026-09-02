"use client";

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, ShoppingCart, MapPin, X } from "lucide-react";
import { categoryLabel, formatINR, inr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { Logo } from "./Logo";

const NAV = ["smartphones", "laptops", "mens-watches", "womens-bags", "beauty", "groceries"];

type Suggestion = {
  id: number;
  title: string;
  category: string;
  price: number;
  thumbnail: string;
};

export function Header({ categories }: { categories: string[] }) {
  const router = useRouter();
  const { count, setOpen } = useCart();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [stuck, setStuck] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setStuck(v > 12));

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Type-ahead runs in the browser, so it asks the search API rather than the
  // database. Debounced, and stale responses are dropped on unmount.
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => setSuggestions(data.results ?? []))
        .catch(() => {});
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  // Close the suggestion sheet on an outside click.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setFocused(false);
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-50">
      <motion.div
        animate={{
          backgroundColor: stuck ? "rgba(5,7,15,0.82)" : "rgba(5,7,15,0)",
          borderColor: stuck ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.35 }}
        className="border-b backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:gap-5 sm:px-6">
          <Logo />

          <button className="hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs text-haze transition-colors hover:text-white lg:flex">
            <MapPin size={15} className="text-flame" />
            <span className="leading-tight">
              Deliver to
              <br />
              <span className="font-semibold text-white">Punjab 144411</span>
            </span>
          </button>

          {/* search */}
          <div ref={boxRef} className="relative flex-1">
            <form onSubmit={submit}>
              <div
                className={`glass flex items-center gap-2 rounded-full px-4 transition-all duration-300 ${
                  focused ? "border-flame/60 shadow-lg shadow-flame/10" : ""
                }`}
              >
                <Search size={17} className={focused ? "text-flame" : "text-haze"} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onFocus={() => setFocused(true)}
                  placeholder="Search phones, watches, groceries…"
                  className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-haze/70"
                />
                {q && (
                  <button type="button" onClick={() => setQ("")} aria-label="Clear search">
                    <X size={15} className="text-haze hover:text-white" />
                  </button>
                )}
              </div>
            </form>

            <AnimatePresence>
              {focused && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="glass absolute left-0 right-0 top-14 z-50 overflow-hidden rounded-2xl p-1.5"
                >
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      onClick={() => setFocused(false)}
                      className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.06]"
                    >
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
                        <Image
                          src={p.thumbnail}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-contain p-1"
                        />
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-white">{p.title}</span>
                        <span className="block text-[11px] text-haze">
                          {categoryLabel(p.category)}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-flame">
                        {formatINR(inr(p.price))}
                      </span>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* cart */}
          <button
            onClick={() => setOpen(true)}
            aria-label={`Cart, ${count} items`}
            className="glass relative flex h-11 items-center gap-2 rounded-full px-4 transition-colors hover:border-flame/50"
          >
            <ShoppingCart size={18} className="text-white" />
            <span className="hidden text-sm font-semibold text-white sm:block">Cart</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-flame px-1 text-[11px] font-bold text-white shadow-lg shadow-flame/40"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* category strip */}
        <div className="no-scrollbar mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 pb-2 sm:px-6">
          <Link
            href="/search"
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/[0.07]"
          >
            All
          </Link>
          {NAV.map((c) => (
            <Link
              key={c}
              href={`/search?category=${c}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-haze transition-colors hover:bg-white/[0.07] hover:text-white"
            >
              {categoryLabel(c)}
            </Link>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-white/10" />
          {categories
            .filter((c) => !NAV.includes(c))
            .slice(0, 6)
            .map((c) => (
              <Link
                key={c}
                href={`/search?category=${c}`}
                className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-haze transition-colors hover:bg-white/[0.07] hover:text-white"
              >
                {categoryLabel(c)}
              </Link>
            ))}
        </div>
      </motion.div>
    </header>
  );
}
