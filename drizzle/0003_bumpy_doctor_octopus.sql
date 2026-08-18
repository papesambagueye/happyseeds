ALTER TABLE "users" ADD COLUMN "referral_code" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_referral_code_idx" ON "users" USING btree ("referral_code");