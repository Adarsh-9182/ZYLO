"use client";

import { MotionConfig } from "framer-motion";
import { CartProvider } from "@/lib/cart";

/**
 * `reducedMotion="user"` makes every Framer Motion animation in the app honour
 * the OS setting — transforms and opacity fades are dropped automatically.
 * The CSS-only animations opt out separately in globals.css.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <CartProvider>{children}</CartProvider>
    </MotionConfig>
  );
}
