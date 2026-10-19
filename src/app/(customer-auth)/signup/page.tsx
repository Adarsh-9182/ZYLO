import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerAuthForm } from "@/components/CustomerAuthForm";
import { customer } from "@/lib/customer-auth/server";
import { customerReturnTo } from "@/lib/customer-auth/return-to";
export const metadata: Metadata = { title: "Sign up — Zylo" };
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = customerReturnTo((await searchParams).next);
  if (await customer()) redirect(next);
  return <CustomerAuthForm mode="signup" returnTo={next} />;
}
