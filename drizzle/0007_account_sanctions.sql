ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspension_until" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspension_reason" text;
CREATE INDEX IF NOT EXISTS "users_status_idx" ON "users" USING btree ("status");