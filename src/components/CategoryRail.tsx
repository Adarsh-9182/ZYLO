"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { categoryLabel } from "@/lib/format";
import { revealItem, RevealGroup } from "./Reveal";

export function CategoryRail({
  entries,
}: {
  entries: { slug: string; count: number; image: string }[];
}) {
  return (
    <RevealGroup className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2 sm:px-6">
      {entries.map((c) => (
        <motion.div key={c.slug} variants={revealItem} className="shrink-0">
          <Link
            href={`/search?category=${c.slug}`}
            className="group glass relative flex h-36 w-40 flex-col justify-end overflow-hidden rounded-2xl p-3.5 transition-colors hover:border-flame/50"
          >
            <div className="absolute inset-0">
              <Image
                src={c.image}
                alt=""
                fill
                sizes="160px"
                className="object-contain p-5 opacity-40 transition-all duration-500 group-hover:scale-110 group-hover:opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
            </div>
            <div className="relative">
              <p className="text-sm font-bold leading-tight text-white">
                {categoryLabel(c.slug)}
              </p>
              <p className="text-[11px] text-haze">{c.count} items</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </RevealGroup>
  );
}
