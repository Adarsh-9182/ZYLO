import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { customer } from "@/lib/customer-auth/server";

export const metadata: Metadata = {
  title: "Checkout — Zylo",
  description: "Confirm your order and where it should go.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { storeSettings } = await import("@/lib/admin/queries");
  const settings = await storeSettings();
  const user = await customer();
  return (
    <CheckoutForm
      shippingPaise={Number(settings.shipping_paise)}
      freeShippingAbovePaise={Number(settings.free_shipping_above_paise)}
      customer={user ? { name: user.name, email: user.email } : undefined}
    />
  );
}
