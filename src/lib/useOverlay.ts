"use client";

import { useEffect } from "react";

/**
 * Shared behaviour for the cart drawer and the mobile filter sheet: Escape
 * closes them, and the page behind stops scrolling while they're open.
 * Without the scroll lock the background slides around under the overlay,
 * which is the single most obvious "unfinished" tell on a storefront.
 */
export function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    // Compensate for the vanishing scrollbar so the layout doesn't jump.
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
}
