"use client";

const ITEMS = [
  "FREE DELIVERY OVER ₹4,999",
  "7-DAY RETURNS",
  "COD AVAILABLE",
  "194 LIVE DEALS",
  "SHOP MORE. SAVE MORE.",
  "NEXT-DAY DISPATCH",
];

/**
 * Duplicated once so the -50% translate loops seamlessly.
 */
export function Marquee() {
  const strip = [...ITEMS, ...ITEMS];

  return (
    <div className="relative flex overflow-hidden border-y border-white/10 bg-flame/[0.07] py-2.5">
      <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
        {strip.map((item, i) => (
          <span
            key={i}
            className="flex shrink-0 items-center gap-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70"
          >
            {item}
            <span className="h-1 w-1 rounded-full bg-flame" />
          </span>
        ))}
      </div>
    </div>
  );
}
