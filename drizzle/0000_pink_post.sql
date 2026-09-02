CREATE TABLE "products" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" varchar(256) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"brand" varchar(128),
	"price" real NOT NULL,
	"discount_percentage" real DEFAULT 0 NOT NULL,
	"rating" real DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"thumbnail" text NOT NULL,
	"images" text[] DEFAULT '{}' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"warranty_information" text,
	"shipping_information" text,
	"return_policy" text,
	"availability_status" varchar(32)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"reviewer_name" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "products_rating_idx" ON "products" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "products_discount_idx" ON "products" USING btree ("discount_percentage");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");