INSERT INTO "promotions" ("id", "product_id", "promotional_price", "starts_at", "ends_at", "active", "created_at", "updated_at")
SELECT
  'legacy-promo-' || fs."id",
  fs."product_id",
  fs."sale_price",
  fs."starts_at",
  fs."ends_at",
  fs."active",
  fs."created_at",
  now()
FROM "flash_sales" fs
INNER JOIN "products" p ON p."id" = fs."product_id"
WHERE p."compare_at_price" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "promotions" pr WHERE pr."product_id" = fs."product_id"
  );

DELETE FROM "flash_sales" fs
USING "products" p
WHERE p."id" = fs."product_id"
  AND p."compare_at_price" IS NOT NULL;