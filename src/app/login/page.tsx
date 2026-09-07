import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, ShieldCheck, Truck, Heart } from "lucide-react";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Zylo to track orders, save addresses and keep a wishlist.",
  robots: { index: false, follow: false },
};

/**
 * The sign-in page, before there are accounts.
 *
 * Accounts are not built yet. The honest options were to hide the button until
 * they are, or to show a page that says so — and hiding it makes the header
 * look unfinished to everyone who scans a shop for "where do I sign in".
 *
 * What is deliberately NOT here is a working-looking email and password form.
 * A form that accepts a password and then does nothing with it is worse than
 * no form: people reuse passwords, and typing a real one into a field that
 * goes nowhere is a security problem we would have created ourselves.
 */
const PERKS = [
  { icon: Truck, title: "Track every order", note: "See where a parcel is without digging through email." },
  { icon: Heart, title: "Keep a wishlist", note: "Save what you liked and come back to it." },
  { icon: ShieldCheck, title: "Saved addresses", note: "Checkout without retyping your address each time." },
];

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-haze transition-colors hover:text-white"
      >
        <ArrowLeft size={15} /> Back to the shop
      </Link>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-12">
        <div>
          <Logo />
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Accounts are coming
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-haze">
            You can shop and check out right now without one — Zylo takes your address at
            checkout and pays on delivery. Signing in will be for the things that need to
            remember you.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex h-12 items-center justify-center rounded-full bg-flame px-7 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
            >
              Start shopping
            </Link>
            <a
              href="mailto:hello@zylo.shopping?subject=Tell%20me%20when%20Zylo%20accounts%20are%20live"
              className="glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold text-white transition-colors hover:border-flame/50"
            >
              <Mail size={16} />
              Tell me when it&apos;s live
            </a>
          </div>
        </div>

        <ul className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <li className="text-[11px] font-bold uppercase tracking-[0.16em] text-flame">
            What an account will do
          </li>
          {PERKS.map(({ icon: Icon, title, note }) => (
            <li key={title} className="flex gap-3.5">
              <Icon size={18} className="mt-0.5 shrink-0 text-haze" />
              <div>
                <p className="text-[14px] font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-haze">{note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
