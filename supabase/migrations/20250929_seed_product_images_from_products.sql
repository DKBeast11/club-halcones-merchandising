-- Seed: 20250929_seed_product_images_from_products.sql
-- Migra image_url desde products a product_images cuando no existan imágenes para el producto

BEGIN;

-- Inserta una fila en product_images por cada producto que tenga products.image_url
-- y que no tenga ya filas en product_images.
INSERT INTO product_images (product_id, image_url, position)
SELECT p.id, p.image_url, 0
FROM products p
WHERE p.image_url IS NOT NULL
  AND trim(p.image_url) <> ''
  AND NOT EXISTS (
    SELECT 1 FROM product_images pi WHERE pi.product_id = p.id
  );

-- (Opcional) Si quieres eliminar la columna image_url de products o dejarla vacía
-- para evitar duplicados en el futuro, puedes descomentar la siguiente línea.
-- UPDATE products SET image_url = NULL WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = products.id);

COMMIT;
