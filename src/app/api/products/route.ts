import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

const MAX_IDS = 100;

/** Resolves the ids the browser's cart keeps in localStorage back into products. */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [
    ...new Set(
      raw
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n > 0)
    ),
  ].slice(0, MAX_IDS);

  if (ids.length === 0) return NextResponse.json({ products: [] });

  const rows = await db.select().from(products).where(inArray(products.id, ids));
  return NextResponse.json({ products: rows });
}
