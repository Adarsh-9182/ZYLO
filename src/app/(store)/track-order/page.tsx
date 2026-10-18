import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/TrackOrderForm";
export const metadata: Metadata = {
  title: "Track your order",
  robots: { index: false, follow: false },
};
export default function TrackOrder() {
  return (
    <div className="mx-auto max-w-md px-5 py-16">
      <h1 className="text-3xl font-bold">Track your order</h1>
      <p className="mt-3 text-sm leading-relaxed text-haze">
        Enter your reference and checkout email to securely view your order,
        delivery status and tracking details.
      </p>
      <TrackOrderForm />
    </div>
  );
}
