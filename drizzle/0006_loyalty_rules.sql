ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "birth_date" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "airpod_rewarded_at" timestamp;
ALTER TABLE "loyalty_events" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "loyalty_expires_idx" ON "loyalty_events" USING btree ("expires_at");