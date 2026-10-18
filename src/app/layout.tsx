import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

/**
 * The site's own address.
 *
 * Without it Next resolves every og:image and canonical against
 * http://localhost:3000 — which is what it was doing, and which makes a
 * shared link preview point at the sharer's own machine. Read from the
 * environment so a preview deployment describes itself rather than
 * production.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Zylo — Shop more. Save more.",
    template: "%s — Zylo",
  },
  description:
    "Zylo is a fast, animated storefront: 199 products across 24 categories, live deals, and a cart that keeps up with you.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Zylo — Shop more. Save more.",
    description: "A fast, animated storefront with live deals across 24 categories.",
    type: "website",
    url: SITE_URL,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${outfit.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
