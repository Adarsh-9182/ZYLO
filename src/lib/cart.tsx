"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { byId, inr, type Product } from "./catalog";

type Line = { id: number; qty: number };

type CartState = {
  lines: Line[];
  items: { product: Product; qty: number }[];
  count: number;
  subtotal: number;
  savings: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: number, qty?: number) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

const KEY = "zylo.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);

  const [hydrated, setHydrated] = useState(false);

  // Read once on mount rather than seeding useState, so the server and the
  // first client render agree. Storage can throw in private windows, so every
  // access is guarded.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    // Both effects run on the first commit, and this one would otherwise write
    // the still-empty initial state straight over the saved cart. A state flag
    // (not a ref) is what actually defers it: the ref would already read true
    // by the time this effect ran in that same commit.
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, hydrated]);

  // Quantities are clamped to stock here rather than in the UI, so no entry
  // point — quick-add, product page, the drawer's +  — can oversell an item.
  const add = useCallback((id: number, qty = 1) => {
    const product = byId(id);
    if (!product || product.stock === 0) return;

    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) {
        return prev.map((l) =>
          l.id === id ? { ...l, qty: Math.min(product.stock, l.qty + qty) } : l
        );
      }
      return [...prev, { id, qty: Math.min(product.stock, qty) }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: number) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    const stock = byId(id)?.stock ?? 0;
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty: Math.min(stock, qty) } : l))
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const items = useMemo(
    () =>
      lines
        .map((l) => {
          const product = byId(l.id);
          return product ? { product, qty: l.qty } : null;
        })
        .filter((x): x is { product: Product; qty: number } => x !== null),
    [lines]
  );

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + inr(i.product.price) * i.qty, 0);
  const savings = items.reduce((n, i) => {
    const now = inr(i.product.price);
    const was = Math.round(now / (1 - i.product.discountPercentage / 100));
    return n + (was - now) * i.qty;
  }, 0);

  const value: CartState = {
    lines,
    items,
    count,
    subtotal,
    savings,
    open,
    setOpen,
    add,
    remove,
    setQty,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
