import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { categories } from "@/lib/catalog";

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
  const cats = await categories();

  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <Providers>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-flame focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Header categories={cats} />
            <main id="main" className="flex-1">
              {children}
            </main>
            <Footer categories={cats} />
          </div>
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}
