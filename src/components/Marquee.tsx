const ITEMS = [
  "FREE DELIVERY OVER ₹4,999",
  "7-DAY RETURNS",
  "COD AVAILABLE",
  "194 LIVE DEALS",
  "SHOP MORE. SAVE MORE.",
  "NEXT-DAY DISPATCH",
];

function Group({ duplicate = false }: { duplicate?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={duplicate}>
      {ITEMS.map((item) => (
        <span
          key={item}
          className="flex shrink-0 items-center gap-8 pr-8 text-[11px] font-bold uppercase tracking-[0.22em] text-white/70"
        >
          {item}
          <span className="h-1 w-1 shrink-0 rounded-full bg-flame" />
        </span>
      ))}
    </div>
  );
}

/**
 * Two identical groups on one track. Because each group carries its own
 * trailing spacing, translating the track by exactly -50% lands on the start
 * of the second group and the loop has no visible seam.
 */
export function Marquee() {
  return (
    <div className="relative flex overflow-hidden border-y border-white/10 bg-flame/[0.07] py-2.5">
      <div className="animate-marquee flex">
        <Group />
        <Group duplicate />
      </div>
    </div>
  );
}
