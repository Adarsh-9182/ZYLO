"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { formatINR, inr } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useOverlay } from "@/lib/useOverlay";

export function CartDrawer() {
  const { open, setOpen, items, count, subtotal, savings, setQty, remove, clear } =
    useCart();
  const [placed, setPlaced] = useState(false);

  // Closing also drops the confirmation screen, so reopening the cart never
  // shows a stale "order placed" state.
  const close = useCallback(() => {
    setOpen(false);
    setPlaced(false);
  }, [setOpen]);
  useOverlay(open, close);

  const freeShippingAt = 4999;
  const toFree = Math.max(0, freeShippingAt - subtotal);
  const progress = Math.min(100, (subtotal / freeShippingAt) * 100);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-[420px] flex-col border-l border-white/10 bg-ink-2"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-white">
                <ShoppingBag size={17} className="text-flame" />
                Your cart
                <span className="text-haze">({count})</span>
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="rounded-full p-1.5 text-haze transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* free-shipping meter */}
            {items.length > 0 && (
              <div className="border-b border-white/10 px-5 py-3">
                <p className="text-[11px] text-haze">
                  {toFree > 0 ? (
                    <>
                      <span className="font-semibold text-white">{formatINR(toFree)}</span> away
                      from free delivery
                    </>
                  ) : (
                    <span className="font-semibold text-flame-2">
                      Free delivery unlocked
                    </span>
                  )}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                    className="h-full rounded-full bg-gradient-to-r from-flame to-flame-2"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {placed ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <motion.span
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-flame"
                  >
                    <Check size={26} className="text-white" strokeWidth={3} />
                  </motion.span>
                  <p className="text-base font-bold text-white">Order placed</p>
                  <p className="max-w-[16rem] text-xs leading-relaxed text-haze">
                    This is a demo storefront, so no payment was taken and nothing
                    will ship.
                  </p>
                  <button
                    onClick={() => {
                      setPlaced(false);
                      close();
                    }}
                    className="mt-1 rounded-full bg-flame px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-2"
                  >
                    Keep shopping
                  </button>
                </div>
              ) : items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag size={38} className="text-white/15" />
                  <p className="text-sm text-haze">Cart is empty.</p>
                  <button
                    onClick={close}
                    className="rounded-full bg-flame px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-flame-2"
                  >
                    Start shopping
                  </button>
                </div>
              ) : (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map(({ product, qty }) => (
                      <motion.li
                        key={product.id}
                        layout
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                        transition={{ type: "spring", stiffness: 360, damping: 34 }}
                        className="glass flex gap-3 rounded-2xl p-2.5"
                      >
                        <Link
                          href={`/product/${product.id}`}
                          onClick={close}
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5"
                        >
                          <Image
                            src={product.thumbnail}
                            alt={product.title}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-sm font-semibold text-white">
                            {product.title}
                          </p>
                          <p className="text-[11px] text-haze">{product.brand}</p>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1 rounded-full border border-white/10 p-0.5">
                              <button
                                onClick={() => setQty(product.id, qty - 1)}
                                aria-label="Decrease quantity"
                                className="rounded-full p-1 text-haze transition-colors hover:bg-white/10 hover:text-white"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="w-5 text-center text-xs font-semibold text-white">
                                {qty}
                              </span>
                              <button
                                onClick={() => setQty(product.id, qty + 1)}
                                aria-label="Increase quantity"
                                className="rounded-full p-1 text-haze transition-colors hover:bg-white/10 hover:text-white"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <span className="text-sm font-bold text-white">
                              {formatINR(inr(product.price) * qty)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => remove(product.id)}
                          aria-label={`Remove ${product.title}`}
                          className="self-start rounded-full p-1.5 text-haze/60 transition-colors hover:bg-white/10 hover:text-flame"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-white/10 px-5 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-haze">Subtotal</span>
                  <motion.span
                    key={subtotal}
                    initial={{ opacity: 0.4, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg font-bold text-white"
                  >
                    {formatINR(subtotal)}
                  </motion.span>
                </div>
                {savings > 0 && (
                  <p className="text-xs text-flame-2">
                    You save {formatINR(savings)} on this order
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    setPlaced(true);
                    clear();
                  }}
                  className="w-full rounded-full bg-gradient-to-r from-flame to-flame-2 py-3.5 text-sm font-bold text-white shadow-lg shadow-flame/25"
                >
                  Checkout · {formatINR(subtotal)}
                </motion.button>
                <p className="text-center text-[11px] text-haze">
                  Secure payments · 7-day returns
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
