DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'discount'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "discount" integer DEFAULT 0 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'voucher_code'
  ) THEN
    ALTER TABLE "orders" ADD COLUMN "voucher_code" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "referred_by" text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "referral_code" text;
  END IF;
END $$;

ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_referred_by_users_id_fk";

ALTER TABLE "users"
  ADD CONSTRAINT "users_referred_by_users_id_fk"
  FOREIGN KEY ("referred_by") REFERENCES "public"."users"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

INSERT INTO "store_config" ("key", "value", "updated_at")
VALUES ('site_name', 'TECH 221', now()), ('logo_url', '', now())
ON CONFLICT ("key") DO NOTHING;
