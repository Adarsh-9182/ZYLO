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

/**
 * A placed order.
 *
 * Zylo has no accounts, so an order is identified by a reference the shopper
 * can be given and look up — not by a user id. The reference is short, upper
 * case and avoids the characters people misread out loud (O/0, I/1), because
 * its whole job is to survive being read off a screen.
 *
 * Money is stored in paise as an integer. Storing rupees as a float is how a
 * total ends up at 1798.9999999999998, and an order total is the one number
 * in this app a customer will check by hand.
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 16 }).notNull().unique(),

    customerName: varchar("customer_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    addressLine: text("address_line").notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    state: varchar("state", { length: 80 }).notNull(),
    pincode: varchar("pincode", { length: 10 }).notNull(),

    /** Paise. Sum of the lines below, plus shipping, at the time of ordering. */
    subtotalPaise: integer("subtotal_paise").notNull(),
    shippingPaise: integer("shipping_paise").notNull().default(0),
    totalPaise: integer("total_paise").notNull(),

    paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("cod"),
    status: varchar("status", { length: 20 }).notNull().default("placed"),
    placedAt: timestamp("placed_at").notNull().defaultNow(),
  },
  (t) => [index("orders_reference_idx").on(t.reference)]
);

/**
 * What was bought, captured rather than referenced.
 *
 * Title and price are copied onto the line instead of being read back through
 * the product. A catalog changes — prices move, titles get rewritten, rows get
 * deleted — and an order is a record of what was agreed at one moment. A
 * receipt that silently reprices itself is not a receipt.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").notNull(),
    title: varchar("title", { length: 256 }).notNull(),
    thumbnail: text("thumbnail").notNull(),
    /** Paise, per unit, as charged. */
    unitPaise: integer("unit_paise").notNull(),
    qty: integer("qty").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
