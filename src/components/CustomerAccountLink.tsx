"use client";
import Link from "next/link";
import { User } from "lucide-react";
import { authClient } from "@/lib/customer-auth/client";
export function CustomerAccountLink() {
  const { data } = authClient.useSession();
  const signedIn = Boolean(data?.user);
  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      aria-label={signedIn ? "My account" : "Sign in"}
      className="glass flex h-11 items-center gap-2 rounded-full px-3.5 transition-colors hover:border-flame/50 sm:px-4"
    >
      <User size={18} className="text-white" />
      <span className="hidden text-sm font-semibold text-white sm:block">
        {signedIn ? "My account" : "Sign in"}
      </span>
    </Link>
  );
}
