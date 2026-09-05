import "server-only";
import { and, asc, desc, eq, gte, ilike, lt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { products as t, reviews as r } from "@/db/schema";
import { inr } from "./format";

export type { Product, SortKey } from "./format";
export { inr, formatINR, mrp, categoryLabel, sortProducts } from "./format";

export function allProducts() {
  return db.select().from(t).orderBy(asc(t.id));
}

/**
 * Zylo's own products — the ones with a designed poster.
 *
 * Ordered by id, which is the order they were authored in and the order the
 * posters were made in; there is no ranking to apply to five items, and a
 * rail that reshuffles itself between visits is harder to point someone at.
 */
export function houseProducts() {
  return db.select().from(t).where(eq(t.house, true)).orderBy(asc(t.id));
}

export function byId(id: number) {
  return db.query.products.findFirst({ where: eq(t.id, id) });
}

export function reviewsFor(productId: number) {
  return db
    .select()
    .from(r)
    .where(eq(r.productId, productId))
    .orderBy(desc(r.createdAt));
}

export function byCategory(slug: string, limit?: number) {
  const q = db.select().from(t).where(eq(t.category, slug)).orderBy(asc(t.id));
  return limit ? q.limit(limit) : q;
}

/** Same-category picks for the "you might also like" rail on a product page. */
export function related(p: { id: number; category: string }, count = 6) {
  return db
    .select()
    .from(t)
    .where(and(eq(t.category, p.category), ne(t.id, p.id)))
    .limit(count);
}

export async function categories() {
  const rows = await db
    .selectDistinct({ category: t.category })
    .from(t)
    .orderBy(asc(t.category));
  return rows.map((row) => row.category);
}

/** Derived from the catalog so the price filter can never exclude real items. */
export async function priceBounds() {
  const [row] = await db
    .select({ min: sql<number>`min(${t.price})`, max: sql<number>`max(${t.price})` })
    .from(t);
  return { min: inr(row.min), max: inr(row.max) };
}

/** Deals = biggest discounts, which is what an offers rail should actually surface. */
export function deals(limit = 12) {
  return db.select().from(t).orderBy(desc(t.discountPercentage)).limit(limit);
}

export function topRated(limit = 12) {
  return db
    .select()
    .from(t)
    .where(gte(t.rating, 4.5))
    .orderBy(desc(t.rating))
    .limit(limit);
}

/** Low stock reads as "selling fast", which is what the trending rail is for. */
export function trending(limit = 12) {
  return db.select().from(t).where(lt(t.stock, 40)).orderBy(asc(t.id)).limit(limit);
}

export function search(query: string, limit = 200) {
  const q = query.trim();
  if (!q) return Promise.resolve([]);
  const like = `%${q}%`;
  return db
    .select()
    .from(t)
    .where(
      or(
        ilike(t.title, like),
        ilike(t.category, like),
        ilike(t.brand, like),
        sql`exists (select 1 from unnest(${t.tags}) tag where tag ilike ${like})`
      )
    )
    .orderBy(asc(t.id))
    .limit(limit);
}

/** Category tiles for the home rail: name, how many items, one representative image. */
export async function categoryEntries() {
  return db
    .select({
      slug: t.category,
      count: sql<number>`count(*)::int`,
      image: sql<string>`min(${t.thumbnail})`,
    })
    .from(t)
    .groupBy(t.category)
    .orderBy(desc(sql`count(*)`));
}
