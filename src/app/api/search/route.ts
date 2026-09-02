import { NextResponse } from "next/server";
import { search } from "@/lib/catalog";

/** Powers the header's type-ahead, which runs in the browser and can't touch the DB. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const rows = await search(q, 6);
  const results = rows.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    price: p.price,
    thumbnail: p.thumbnail,
  }));

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
