import type { Product } from "@/db/schema";

export type { Product };

/** Rupee price. The source data is in dollars, so scale it to something that reads Indian. */
export function inr(price: number) {
  return Math.round(price * 84);
}

export function formatINR(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

export function mrp(p: Pick<Product, "price" | "discountPercentage">) {
  return Math.round(inr(p.price) / (1 - p.discountPercentage / 100));
}

export function categoryLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "discount";

/** Pure, so the search page can re-sort in the browser without a round trip. */
export function sortProducts<T extends Pick<Product, "price" | "rating" | "discountPercentage">>(
  list: T[],
  key: SortKey
) {
  const copy = [...list];
  switch (key) {
    case "price-asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price-desc":
      return copy.sort((a, b) => b.price - a.price);
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "discount":
      return copy.sort((a, b) => b.discountPercentage - a.discountPercentage);
    default:
      return copy;
  }
}
