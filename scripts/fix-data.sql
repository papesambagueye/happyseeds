-- Delete invalid promotions (where promo price >= actual price)
DELETE FROM promotions WHERE promotional_price >= (SELECT price FROM products WHERE products.id = promotions.product_id);

-- Create flash_sales for products that should be flash sales
INSERT INTO flash_sales (product_id, sale_price, active, label, created_at, updated_at)
SELECT id, price, 1, 'Flash sale', NOW(), NOW()
FROM products
WHERE (name LIKE '%VENTE FLASH%' OR name = 'Ps4')
  AND id NOT IN (SELECT product_id FROM flash_sales)
  AND stock = 1;

-- Verify data
SELECT 'Promotions remaining:' as info, COUNT(*) as count FROM promotions
UNION ALL
SELECT 'Flash sales total:' as info, COUNT(*) as count FROM flash_sales;
