import type { Metadata } from "next";
import "./customer-auth.css";
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function CustomerAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="customer-auth">{children}</main>;
}
