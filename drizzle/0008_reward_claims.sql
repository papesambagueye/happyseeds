CREATE TABLE IF NOT EXISTS "reward_claims" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "product_id" text NOT NULL REFERENCES "products"("id") ON DELETE restrict,
  "voucher_id" text NOT NULL REFERENCES "vouchers"("id") ON DELETE restrict,
  "points" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "claimed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "reward_claims_user_idx" ON "reward_claims" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "reward_claims_status_idx" ON "reward_claims" USING btree ("status");