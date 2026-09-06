import type { Metadata } from "next";

/**
 * Search is a view of the catalog, not a page of its own — every query is the
 * same page with a filter applied. One canonical for all of them keeps a
 * crawler from indexing a thousand near-identical result sets.
 */
export const metadata: Metadata = {
  title: "Search",
  description: "Search and filter the whole Zylo catalog by category, price and rating.",
  alternates: { canonical: "/search" },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
