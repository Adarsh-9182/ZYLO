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

  // Storage can throw in private windows, so every access is guarded.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setLines(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const add = useCallback((id: number, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.id === id);
      if (found) {
        return prev.map((l) => (l.id === id ? { ...l, qty: l.qty + qty } : l));
      }
      return [...prev, { id, qty }];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((id: number) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l))
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
