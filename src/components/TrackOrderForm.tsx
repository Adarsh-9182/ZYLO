"use client";
import { useActionState, useState } from "react";
import { trackOrderAction } from "@/lib/order-tracking";
export function TrackOrderForm() {
  const [state, action, pending] = useActionState(trackOrderAction, {});
  const [reference, setReference] = useState(""),
    [email, setEmail] = useState("");
  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block text-sm">
        Order reference
        <input
          name="reference"
          required
          placeholder="ZY-…"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-2 block h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4"
        />
      </label>
      <label className="block text-sm">
        Email used at checkout
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 block h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4"
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-full bg-flame px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending ? "Finding your order…" : "Track order"}
      </button>
    </form>
  );
}
