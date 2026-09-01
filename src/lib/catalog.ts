import raw from "@/data/products.json";

export type Review = {
  rating: number;
  comment: string;
  date: string;
  reviewerName: string;
};

export type Product = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand?: string;
  thumbnail: string;
  images: string[];
  tags: string[];
  reviews: Review[];
  warrantyInformation: string;
  shippingInformation: string;
  returnPolicy: string;
  availabilityStatus: string;
};

export const products: Product[] = (raw as { products: Product[] }).products;

/** Rupee price. The source data is in dollars, so scale it to something that reads Indian. */
export function inr(price: number) {
  return Math.round(price * 84);
}

export function formatINR(value: number) {
  return "₹" + value.toLocaleString("en-IN");
}

export function mrp(p: Product) {
  return Math.round(inr(p.price) / (1 - p.discountPercentage / 100));
}

export function categoryLabel(slug: string) {
  return slug
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export const categories = [...new Set(products.map((p) => p.category))].sort();

export function byId(id: number) {
  return products.find((p) => p.id === id);
}

export function byCategory(slug: string) {
  return products.filter((p) => p.category === slug);
}

/** Deals = biggest discounts, which is what an offers rail should actually surface. */
export const deals = [...products]
  .sort((a, b) => b.discountPercentage - a.discountPercentage)
  .slice(0, 12);

export const topRated = [...products]
  .filter((p) => p.rating >= 4.5)
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 12);

export function search(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.brand ?? "").toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export type SortKey = "relevance" | "price-asc" | "price-desc" | "rating" | "discount";

export function sortProducts(list: Product[], key: SortKey) {
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

/** Category tiles for the home rail: name, how many items, one representative image. */
export function categoryEntries() {
  const map = new Map<string, { slug: string; count: number; image: string }>();
  for (const p of products) {
    const found = map.get(p.category);
    if (found) found.count += 1;
    else map.set(p.category, { slug: p.category, count: 1, image: p.thumbnail });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/** Same-category picks, used for the "you might also like" rail on a product page. */
export function related(p: Product, count = 6) {
  return products
    .filter((x) => x.category === p.category && x.id !== p.id)
    .slice(0, count);
}
