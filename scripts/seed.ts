import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";
import raw from "../src/data/products.json";

type Source = (typeof raw)["products"][number];

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });

async function main() {
  const source = raw.products as Source[];

  // Reviews cascade from products, so clearing products is enough.
  await db.delete(schema.products);

  await db.insert(schema.products).values(
    source.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      brand: p.brand ?? null,
      price: p.price,
      discountPercentage: p.discountPercentage,
      rating: p.rating,
      stock: p.stock,
      thumbnail: p.thumbnail,
      images: p.images,
      tags: p.tags,
      warrantyInformation: p.warrantyInformation,
      shippingInformation: p.shippingInformation,
      returnPolicy: p.returnPolicy,
      availabilityStatus: p.availabilityStatus,
    }))
  );

  const rows = source.flatMap((p) =>
    (p.reviews ?? []).map((r) => ({
      productId: p.id,
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.reviewerName,
      createdAt: new Date(r.date),
    }))
  );
  if (rows.length) await db.insert(schema.reviews).values(rows);

  console.log(`Seeded ${source.length} products, ${rows.length} reviews.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
