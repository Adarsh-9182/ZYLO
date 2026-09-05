import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allProducts, byId, categoryLabel, related, reviewsFor } from "@/lib/catalog";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductRail } from "@/components/ProductRail";

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
