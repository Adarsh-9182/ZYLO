import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { VERIFIED } from "../src/data/verified";

/**
 * Add Zylo's own products to the catalog.
 *
 * Separate from `seed.ts`, which clears the table and reloads the sourced
 * sample data. These five are not sample data — running the other script must
 * not take them out, and running this one must not touch the other 194. So it
 * upserts by id, and the ids sit in their own 900 block, well clear of the
 * sourced range.
 */
async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  // Additive and idempotent, so this is safe to re-run against a database
  // that already has the columns.
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS house boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS creative jsonb`;
  await sql`CREATE INDEX IF NOT EXISTS products_house_idx ON products (house)`;

  for (const p of VERIFIED) {
    await sql`
      INSERT INTO products (
        id, title, description, category, brand, price, discount_percentage,
        rating, stock, thumbnail, images, tags, warranty_information,
        shipping_information, return_policy, availability_status, house, creative
      ) VALUES (
        ${p.id}, ${p.title}, ${p.description}, ${p.category}, ${p.brand},
        ${p.price}, ${p.discountPercentage}, ${p.rating}, ${p.stock},
        ${p.thumbnail}, ${p.images as string[]}, ${p.tags as string[]},
        ${p.warrantyInformation}, ${p.shippingInformation}, ${p.returnPolicy},
        ${p.availabilityStatus}, true, ${JSON.stringify(p.creative)}
      )
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        brand = EXCLUDED.brand,
        price = EXCLUDED.price,
        discount_percentage = EXCLUDED.discount_percentage,
        rating = EXCLUDED.rating,
        stock = EXCLUDED.stock,
        thumbnail = EXCLUDED.thumbnail,
        images = EXCLUDED.images,
        tags = EXCLUDED.tags,
        warranty_information = EXCLUDED.warranty_information,
        shipping_information = EXCLUDED.shipping_information,
        return_policy = EXCLUDED.return_policy,
        availability_status = EXCLUDED.availability_status,
        house = true,
        creative = EXCLUDED.creative
    `;
    console.log(`  ${p.id}  ${p.title}`);
  }

  const [{ n }] = (await sql`select count(*)::int as n from products where house`) as { n: number }[];
  console.log(`\n${n} Zylo products in the catalog.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
