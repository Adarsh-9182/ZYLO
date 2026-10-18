import { adminSql } from "@/lib/admin/db";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) return new Response(null, { status: 404 });
  const sql = adminSql();
  const [image] =
    await sql`SELECT content_type,image_base64 FROM product_media WHERE id=${id}::uuid`;
  if (!image) return new Response(null, { status: 404 });
  return new Response(Buffer.from(image.image_base64, "base64"), {
    headers: {
      "Content-Type": image.content_type,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
