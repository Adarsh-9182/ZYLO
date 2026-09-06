import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allProducts, byId, categoryLabel, related, reviewsFor } from "@/lib/catalog";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductRail } from "@/components/ProductRail";

/**
 * Rebuild this page at most once a minute, in the background.
 *
 * It is prerendered, which is right — it is the same for everyone and should
 * be fast. But prerendered at *build time only* meant a price lived in the
 * HTML until the next deploy: Rahul could change what a product sells for,
 * the database would agree, and the shop would keep quoting the old figure to
 * every visitor. For a shop that is not a caching detail, it is wrong prices.
 *
 * Sixty seconds keeps the page as fast as it was and bounds how stale a price
 * can be.
 */
export const revalidate = 60;

export async function generateStaticParams() {
  const all = await allProducts();
  return all.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await byId(Number(id));
  if (!product) return { title: "Not found — Zylo" };

  return {
    title: `${product.title} — Zylo`,
    description: product.description,
    // Each product page is reachable at exactly one path; saying so stops a
    // crawler treating ?ref= and friends as separate pages.
    alternates: { canonical: `/product/${product.id}` },
    openGraph: {
      title: product.title,
      description: product.description,
      images: [product.thumbnail],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await byId(Number(id));
  if (!product) notFound();

  const [alike, productReviews] = await Promise.all([
    related(product, 10),
    reviewsFor(product.id),
  ]);

  return (
    <>
      <ProductDetail product={product} reviews={productReviews} />
      <ProductRail
        eyebrow={categoryLabel(product.category)}
        title="You might also like"
        products={alike}
      />
    </>
  );
}
