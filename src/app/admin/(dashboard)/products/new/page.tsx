import { requireOwner } from "@/lib/admin/auth";
import { adminSql } from "@/lib/admin/db";
import { Heading } from "@/components/admin/UI";
import { ProductForm } from "@/components/admin/Forms";
export default async function NewProduct() {
  await requireOwner();
  const sql = adminSql();
  const cats =
    await sql`SELECT DISTINCT category FROM products ORDER BY category`;
  return (
    <>
      <Heading
        title="Add a product"
        description="Something new for your customers to discover."
      />
      <ProductForm categories={cats.map((c) => String(c.category))} />
    </>
  );
}
