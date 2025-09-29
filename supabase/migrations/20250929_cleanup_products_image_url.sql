-- Cleanup: 20250929_cleanup_products_image_url.sql
-- Pone a NULL products.image_url para los productos que ya tienen imágenes en product_images
-- Este script es idempotente.

BEGIN;

-- Ver cuántos productos se verán afectados (PREVIEW)
-- Ejecuta esta SELECT primero para revisarlo antes del UPDATE
SELECT COUNT(*) AS products_with_images_already
FROM products p
WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
  AND p.image_url IS NOT NULL
  AND trim(p.image_url) <> '';

-- Opcional: listar los productos que serán actualizados
SELECT id, name, image_url
FROM products p
WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
  AND p.image_url IS NOT NULL
  AND trim(p.image_url) <> '';

-- UPDATE idempotente: establece image_url = NULL para los productos con imágenes en product_images
UPDATE products
SET image_url = NULL
WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = products.id)
  AND image_url IS NOT NULL
  AND trim(image_url) <> '';

COMMIT;
