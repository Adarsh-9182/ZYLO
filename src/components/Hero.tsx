"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";
import { formatINR, inr, type Product } from "@/lib/catalog";

const WORDS = ["Everything.", "Faster.", "Cheaper.", "Zylo."];

export function Hero({ floats }: { floats: Product[] }) {
  const ref = useRef<HTMLElement>(null);
  const [word, setWord] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Different depths scroll at different rates — cheap parallax, big effect.
  const yFar = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const yNear = useTransform(scrollYProgress, [0, 1], [0, -180]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative overflow-hidden px-4 pb-8 pt-14 sm:px-6 sm:pt-20">
      {/* animated aurora behind the headline */}
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-flame/20 blur-[120px]"
      />

      <motion.div style={{ opacity: fade }} className="mx-auto max-w-[1400px]">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-haze"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-flame opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-flame" />
              </span>
              Live · 194 deals dropping today
            </motion.span>

            <h1 className="mt-5 text-[clamp(2.6rem,7vw,5.4rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-white">
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  Shop more.
                </motion.span>
              </span>
              <span className="block overflow-hidden">
                <motion.span
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                  className="block text-gradient"
                >
                  Save more.
                </motion.span>
              </span>
            </h1>

            {/* rotating word */}
            <div className="mt-4 flex h-7 items-center gap-2 text-lg text-haze">
              <span>One cart for</span>
              <span className="relative inline-block h-7 w-[7.5rem] overflow-hidden">
                {/* One word on screen at a time, swapped by a timer. Stacking
                    all four with staggered keyframe delays drifted out of sync
                    and left visible gaps between words. */}
                <AnimatePresence mode="wait">
                  <motion.span
                    key={WORDS[word]}
                    initial={{ y: "110%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "-110%" }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 font-semibold text-flame-2"
                  >
                    {WORDS[word]}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                href="/search"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-flame to-flame-2 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-flame/25 transition-transform hover:scale-[1.03]"
              >
                Start shopping
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/search?sort=discount"
                className="glass inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-flame/50"
              >
                Today&apos;s deals
              </Link>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-xs text-haze"
            >
              {[
                { icon: Truck, label: "Free delivery over ₹4,999" },
                { icon: RotateCcw, label: "7-day easy returns" },
                { icon: ShieldCheck, label: "Secure payments" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon size={15} className="text-flame" />
                  {label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* floating product collage */}
          <div className="relative hidden h-[30rem] lg:block">
            {floats.slice(0, 5).map((p, i) => {
              const spots = [
                { top: "2%", left: "12%", w: "12.5rem", depth: yNear, r: -8 },
                { top: "18%", left: "56%", w: "14rem", depth: yFar, r: 6 },
                { top: "48%", left: "4%", w: "13rem", depth: yFar, r: 5 },
                { top: "58%", left: "48%", w: "15rem", depth: yNear, r: -5 },
                { top: "34%", left: "32%", w: "11rem", depth: yFar, r: 10 },
              ][i];

              return (
                <motion.div
                  key={p.id}
                  style={{ top: spots.top, left: spots.left, width: spots.w, y: spots.depth }}
                  initial={{ opacity: 0, scale: 0.8, rotate: spots.r * 2 }}
                  animate={{ opacity: 1, scale: 1, rotate: spots.r }}
                  transition={{
                    duration: 0.9,
                    delay: 0.15 + i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ scale: 1.06, rotate: 0, zIndex: 30 }}
                  className="absolute"
                >
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    transition={{
                      duration: 5 + i,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.4,
                    }}
                  >
                    <Link
                      href={`/product/${p.id}`}
                      className="glass block overflow-hidden rounded-2xl shadow-2xl shadow-black/50 transition-colors hover:border-flame/50"
                    >
                      <div className="relative aspect-square bg-white/[0.04]">
                        <Image
                          src={p.thumbnail}
                          alt={p.title}
                          fill
                          sizes="224px"
                          className="object-contain p-3"
                        />
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="truncate text-[11px] font-medium text-white">
                          {p.title}
                        </span>
                        <span className="shrink-0 pl-2 text-xs font-bold text-flame">
                          {formatINR(inr(p.price))}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
