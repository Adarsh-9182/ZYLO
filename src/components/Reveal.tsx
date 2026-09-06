"use client";

import { motion, type Variants } from "framer-motion";

/**
 * Opacity and transform only — deliberately no blur.
 *
 * This used to animate `filter: blur(6px)` to `blur(0px)`. Opacity and
 * transform are composited on the GPU and cost the phone almost nothing;
 * `filter` is not, so every frame of every reveal forced a repaint of the
 * element underneath it. On a laptop that is invisible. On a phone, with
 * dozens of these on one page, it is the jank — and the reason the site felt
 * fine on a desktop and heavy on a handset.
 *
 * The entrance reads the same without it.
 */
const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Scroll-triggered entrance. `once` so the page doesn't re-animate on the way
 * back up, which reads as jitter rather than polish.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/** Staggers direct children of a grid/rail as it scrolls into view. */
export function RevealGroup({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ show: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

export const revealItem: Variants = variants;
