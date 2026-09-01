"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * The mark redrawn as SVG so it stays crisp, animates, and works on the dark
 * surface — the supplied JPEG is white-background and can't do any of that.
 * Same shapes as the logo: speed lines, a Z as the cart basket, two wheels.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" aria-label="ZYLO home" className="group flex items-center gap-2.5">
      <motion.svg
        width="34"
        height="34"
        viewBox="0 0 64 64"
        fill="none"
        initial={false}
        whileHover="hover"
        className="shrink-0"
      >
        {/* speed lines */}
        <motion.g
          stroke="var(--color-flame)"
          strokeWidth="3.4"
          strokeLinecap="round"
          variants={{ hover: { x: -4, opacity: 1 } }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <line x1="3" y1="19" x2="14" y2="19" />
          <line x1="6" y1="27" x2="15" y2="27" />
        </motion.g>

        {/* cart handle */}
        <path
          d="M15 12h6l3.5 10"
          stroke="var(--color-flame)"
          strokeWidth="4.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Z basket */}
        <motion.path
          d="M26 15h26L33 39h20"
          stroke="#fff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{ hover: { pathLength: [1, 0.15, 1] } }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* cart base + wheels */}
        <path
          d="M25 45h29"
          stroke="var(--color-flame)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
        <motion.g
          variants={{ hover: { rotate: 360 } }}
          transition={{ duration: 0.7, ease: "linear" }}
          style={{ originX: "50%", originY: "50%" }}
        >
          <circle cx="31" cy="54" r="4.4" stroke="var(--color-flame)" strokeWidth="3.4" />
          <circle cx="49" cy="54" r="4.4" stroke="var(--color-flame)" strokeWidth="3.4" />
        </motion.g>
      </motion.svg>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[19px] font-extrabold tracking-[0.22em] text-white">
            ZY<span className="text-flame">L</span>O
          </span>
          <span className="mt-1 hidden text-[8.5px] font-semibold tracking-[0.18em] text-haze sm:block">
            SHOP MORE. <span className="text-flame">SAVE MORE.</span>
          </span>
        </span>
      )}
    </Link>
  );
}
