import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout — Zylo",
  description: "Confirm your order and where it should go.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { storeSettings } = await import("@/lib/admin/queries");
  const settings = await storeSettings();
  return (
    <CheckoutForm
      shippingPaise={Number(settings.shipping_paise)}
      freeShippingAbovePaise={Number(settings.free_shipping_above_paise)}
    />
  );
}
