import {
  pgTable,
  serial,
  integer,
  text,
  varchar,
  real,
  timestamp,
  index,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import type { Creative } from "@/data/creative";

export const products = pgTable(
  "products",
  {
    id: integer("id").primaryKey(),
    title: varchar("title", { length: 256 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    brand: varchar("brand", { length: 128 }),
    /** Source price, in dollars. Rupee display is derived — see lib/catalog. */
    price: real("price").notNull(),
    discountPercentage: real("discount_percentage").notNull().default(0),
    rating: real("rating").notNull().default(0),
    stock: integer("stock").notNull().default(0),
    thumbnail: text("thumbnail").notNull(),
    images: text("images").array().notNull().default([]),
    tags: text("tags").array().notNull().default([]),
    warrantyInformation: text("warranty_information"),
    shippingInformation: text("shipping_information"),
    returnPolicy: text("return_policy"),
    availabilityStatus: varchar("availability_status", { length: 32 }),

    /**
     * Zylo's own products, as opposed to the seeded catalog.
     *
     * The rest of this table is sourced data — useful for building against,
     * but not something Zylo sells. These five are, and they are presented
     * differently because what exists for them is different: a designed
     * poster rather than a cut-out on white.
     */
    house: boolean("house").notNull().default(false),

    /**
     * The poster's editorial content, or null for a sourced product.
     *
     * Kept as one document rather than a dozen columns because it is one
     * thing — the creative — and because its shape is the design system: a
     * new product is authored by filling this in, which is what makes the
     * next poster look like these five. See data/creative.ts.
     */
    creative: jsonb("creative").$type<Creative>(),
  },
  (t) => [
    index("products_category_idx").on(t.category),
    index("products_rating_idx").on(t.rating),
    index("products_discount_idx").on(t.discountPercentage),
    index("products_house_idx").on(t.house),
  ]
);

/** Seeded reviews carry no user; the ones customers write later will. */
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    reviewerName: varchar("reviewer_name", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_product_idx").on(t.productId)]
);

export type Product = typeof products.$inferSelect;
export type Review = typeof reviews.$inferSelect;
