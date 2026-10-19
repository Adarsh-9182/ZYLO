import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerAuthForm } from "@/components/CustomerAuthForm";
import { customer } from "@/lib/customer-auth/server";
import { customerReturnTo } from "@/lib/customer-auth/return-to";
export const metadata: Metadata = { title: "Login — Zylo" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const next = customerReturnTo(params.next);
  if (await customer()) redirect(next);
  return (
    <CustomerAuthForm
      mode="login"
      returnTo={next}
      initialError={
        params.error
          ? "Google sign-in could not be completed. Please try again."
          : undefined
      }
      passwordReset={params.reset === "1"}
    />
  );
}
