import Link from "next/link";
import { categoryLabel } from "@/lib/format";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      ["All products", "/search"],
      ["Today's deals", "/search?sort=discount"],
      ["Top rated", "/search?sort=rating"],
      ["New arrivals", "/search"],
    ] as const,
  },
  {
    title: "Help",
    links: [
      ["Track order", "/track-order"],
      ["Returns & refunds", "#"],
      ["Shipping policy", "#"],
      ["Contact us", "#"],
    ] as const,
  },
  {
    title: "Company",
    links: [
      ["About Zylo", "#"],
      ["Careers", "#"],
      ["Business dashboard", "/admin"],
      ["Press", "#"],
    ] as const,
  },
];

export function Footer({ categories, supportEmail="", supportPhone="", storeName="Zylo" }: { categories: string[]; supportEmail?:string; supportPhone?:string; storeName?:string }) {
  return (
    <footer className="relative mt-16 border-t border-white/10 bg-ink-2/60">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="text-2xl font-extrabold tracking-[0.2em] text-white">
              ZY<span className="text-flame">L</span>O
            </p>
            <p className="mt-2 text-xs font-semibold tracking-[0.16em] text-haze">
              SHOP MORE. <span className="text-flame">SAVE MORE.</span>
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-haze">
              Discover something you’ll love, with clear pricing, easy checkout and cash on delivery.
            </p>
            {(supportEmail||supportPhone)&&<p className="mt-4 text-xs leading-loose text-haze">{supportEmail&&<a className="block hover:text-flame" href={`mailto:${supportEmail}`}>{supportEmail}</a>}{supportPhone&&<a className="block hover:text-flame" href={`tel:${supportPhone}`}>{supportPhone}</a>}</p>}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-haze transition-colors hover:text-flame"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {categories.map((c) => (
              <Link
                key={c}
                href={`/search?category=${c}`}
                className="text-[11px] text-haze/70 transition-colors hover:text-flame"
              >
                {categoryLabel(c)}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-[11px] text-haze/60">
            © {new Date().getFullYear()} {storeName} Commerce. Orders are confirmed at checkout and paid on delivery.
          </p>
        </div>
      </div>
    </footer>
  );
}
