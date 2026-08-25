CREATE TABLE IF NOT EXISTS "promotions" (
  "id" text PRIMARY KEY NOT NULL,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "promotional_price" integer NOT NULL,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "active" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "promotions_product_idx" ON "promotions" USING btree ("product_id");
CREATE INDEX IF NOT EXISTS "promotions_active_idx" ON "promotions" USING btree ("active");