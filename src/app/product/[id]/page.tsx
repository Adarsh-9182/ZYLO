import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { byId, categoryLabel, products, related } from "@/lib/catalog";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductRail } from "@/components/ProductRail";

export function generateStaticParams() {
  return products.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = byId(Number(id));
  if (!product) return { title: "Not found — Zylo" };

  return {
    title: `${product.title} — Zylo`,
    description: product.description,
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
  const product = byId(Number(id));
  if (!product) notFound();

  return (
    <>
      <ProductDetail product={product} />
      <ProductRail
        eyebrow={categoryLabel(product.category)}
        title="You might also like"
        products={related(product, 10)}
      />
    </>
  );
}
