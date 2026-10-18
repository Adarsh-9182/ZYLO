import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";
import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { Heading } from "@/components/admin/UI";
import { ProductForm } from "@/components/admin/Forms";
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwner();
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const sql = adminSql();
  const [[p], cats] = await Promise.all([
    db.select().from(products).where(eq(products.id, id)).limit(1),
    sql`SELECT DISTINCT category FROM products ORDER BY category`,
  ]);
  if (!p) notFound();
  return (
    <>
      <Link className="a-back" href="/admin/products">
        ← Back to products
      </Link>
      <Heading title="Edit product" description={p.title}>
        {p.active && (
          <Link
            className="a-button a-secondary"
            href={`/product/${id}`}
            target="_blank"
          >
            View in store
            <ArrowUpRight size={15} />
          </Link>
        )}
      </Heading>
      <ProductForm
        product={p}
        categories={cats.map((c) => String(c.category))}
      />
    </>
  );
}
