import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  categoryEntries,
  deals,
  topRated,
  trending,
  byCategory,
  allProducts,
} from "@/lib/catalog";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { CategoryRail } from "@/components/CategoryRail";
import { ProductRail, ProductGrid } from "@/components/ProductRail";
import { Reveal } from "@/components/Reveal";

export default async function Home() {
  // One round trip for the whole page rather than a query per rail.
  const [phones, watches, shades, laptops, entries, dealItems, rated, hot, shelf] =
    await Promise.all([
      byCategory("smartphones", 2),
      byCategory("mens-watches", 1),
      byCategory("sunglasses", 1),
      byCategory("laptops", 1),
      categoryEntries(),
      deals(),
      topRated(),
      trending(),
      allProducts(),
    ]);

  const floats = [...phones, ...watches, ...shades, ...laptops];

  return (
    <>
      <Hero floats={floats} />
      <Marquee />

      <section className="py-10">
        <Reveal className="mb-5 px-4 sm:px-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-flame">
            Browse
          </p>
          <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Shop by category
          </h2>
        </Reveal>
        <CategoryRail entries={entries} />
      </section>

      <ProductRail eyebrow="Up to 20% off" title="Today's deals" products={dealItems} />

      {/* full-bleed promo */}
      <Reveal className="px-4 sm:px-6">
        <div className="glass relative overflow-hidden rounded-3xl px-6 py-12 sm:px-12 sm:py-16">
          <div
            aria-hidden
            className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-flame/25 blur-[90px]"
          />
          <div className="relative max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-flame">
              Zylo Prime
            </p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Free delivery on <span className="text-gradient">everything</span>, all year.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-haze">
              Next-day dispatch, priority support and member-only pricing on all 24
              categories. Cancel whenever you like.
            </p>
            <Link
              href="/search"
              className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ink transition-transform hover:scale-[1.03]"
            >
              Explore the catalog
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </Reveal>

      <ProductRail eyebrow="4.5★ and above" title="Top rated" products={rated} />
      <ProductRail eyebrow="Selling fast" title="Trending now" products={hot} />

      <section className="px-4 py-10 sm:px-6">
        <Reveal className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-flame">
              The full shelf
            </p>
            <h2 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Recommended for you
            </h2>
          </div>
          <Link
            href="/search"
            className="shrink-0 text-sm font-semibold text-flame hover:text-flame-2"
          >
            See all →
          </Link>
        </Reveal>
        <ProductGrid products={shelf.slice(0, 20)} />
      </section>
    </>
  );
}
