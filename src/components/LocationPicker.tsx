"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Loader2, MapPin, X } from "lucide-react";
import { useOverlay } from "@/lib/useOverlay";

export interface Place {
  pincode: string;
  city: string;
  state: string;
}

const KEY = "zylo.place.v1";

/**
 * "Deliver to", the way a shopper expects it.
 *
 * The header used to state "Punjab 144411" as a fact about whoever was
 * looking, which is wrong for everyone who is not in Kapurthala. It now says
 * "Enter location" until someone tells it, and remembers what they said.
 *
 * The delivery area is not enforced anywhere yet — nothing refuses an order
 * for being far away — so this is the shopper's own note about where they
 * are, and checkout still asks for the full address. When delivery zones do
 * exist, this is where they will be checked.
 */
export function LocationPicker() {
  const [place, setPlace] = useState<Place | null>(null);
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState<"pin" | "gps" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = useCallback(() => setOpen(false), []);
  useOverlay(open, close);

  // Read once on mount so the server's HTML and the first client paint agree.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setPlace(JSON.parse(saved));
    } catch {}
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function keep(next: Place) {
    setPlace(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setOpen(false);
    setError(null);
    setPin("");
  }

  async function lookup(query: string) {
    setError(null);
    setBusy("pin");
    const res = await fetch(`/api/location?pin=${encodeURIComponent(query)}`).catch(
      () => null
    );
    setBusy(null);
    if (!res || !res.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? "That lookup did not work. Try again.");
      return;
    }
    keep(await res.json());
  }

  function locateMe() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("This browser cannot share a location. Type a PIN code instead.");
      return;
    }
    setBusy("gps");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const res = await fetch(
          `/api/location?lat=${coords.latitude}&lon=${coords.longitude}`
        ).catch(() => null);
        setBusy(null);
        if (!res || !res.ok) {
          const body = await res?.json().catch(() => null);
          setError(body?.error ?? "We could not work out your area.");
          return;
        }
        keep(await res.json());
      },
      () => {
        setBusy(null);
        // Denying the prompt is a choice, not a failure — say what to do next
        // rather than treating it as an error the shopper has to solve.
        setError("No location shared. Type a PIN code instead.");
      },
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={place ? `Deliver to ${place.city}. Change location` : "Set delivery location"}
        className="hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-1.5 text-left text-xs text-haze transition-colors hover:text-white lg:flex"
      >
        <MapPin size={15} className="text-flame" />
        <span className="leading-tight">
          Deliver to
          <br />
          <span className="font-semibold text-white">
            {place ? `${place.city} ${place.pincode}`.trim() : "Enter location"}
          </span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-[60] bg-black/70"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose a delivery location"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="fixed left-1/2 top-1/2 z-[61] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-ink-2 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight text-white">
                    Choose your location
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-haze">
                    Delivery times and charges are worked out from where the order
                    is going.
                  </p>
                </div>
                <button
                  onClick={close}
                  aria-label="Close"
                  className="shrink-0 rounded-full p-1.5 text-haze transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={17} />
                </button>
              </div>

              <button
                onClick={locateMe}
                disabled={busy !== null}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 text-[13.5px] font-semibold text-white transition-colors hover:border-flame/50 disabled:opacity-60"
              >
                {busy === "gps" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Crosshair size={15} className="text-flame" />
                )}
                Use my current location
              </button>

              <div className="my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-haze">or</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (pin.length === 6) lookup(pin);
                }}
              >
                <label htmlFor="pin" className="mb-1.5 block text-[13px] font-semibold text-white">
                  Enter a PIN code
                </label>
                <div className="flex gap-2">
                  <input
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="141001"
                    className="h-12 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[15px] tracking-[0.14em] text-white outline-none transition-colors placeholder:tracking-normal placeholder:text-haze/60 focus:border-flame/60"
                  />
                  <button
                    type="submit"
                    disabled={pin.length !== 6 || busy !== null}
                    className="flex h-12 items-center gap-2 rounded-xl bg-flame px-5 text-[13.5px] font-bold text-white transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100"
                  >
                    {busy === "pin" && <Loader2 size={14} className="animate-spin" />}
                    Apply
                  </button>
                </div>
              </form>

              {error && (
                <p role="alert" className="mt-3.5 text-[12.5px] leading-relaxed text-red-300">
                  {error}
                </p>
              )}

              {place && !error && (
                <p className="mt-3.5 text-[12.5px] text-haze">
                  Currently delivering to{" "}
                  <span className="font-semibold text-white">
                    {place.city}, {place.state} {place.pincode}
                  </span>
                </p>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
