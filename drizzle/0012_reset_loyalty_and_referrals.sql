DELETE FROM "reward_claims";
DELETE FROM "voucher_redemptions";
DELETE FROM "referral_rewards";
DELETE FROM "loyalty_events";
DELETE FROM "vouchers";
UPDATE "users" SET "referred_by" = NULL, "referral_code" = NULL;