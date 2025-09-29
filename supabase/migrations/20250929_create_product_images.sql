-- Migration: 20250929_create_product_images.sql
-- Crea la tabla product_images y elementos auxiliares

BEGIN;

-- Crear tabla si no existe
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_product_images_product_id'
  ) THEN
    CREATE INDEX idx_product_images_product_id ON product_images(product_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_product_images_product_id_position'
  ) THEN
    CREATE INDEX idx_product_images_product_id_position ON product_images(product_id, position);
  END IF;
END$$;

-- Habilitar RLS y política de solo lectura pública para conveniencia
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Crear policy solo si no existe
DO $$
BEGIN
  -- Solo intentar crear la policy si la tabla product_images ya existe en el catálogo
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'product_images') THEN
    -- Comprobar por el nombre de policy correcto en pg_policies (policyname)
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE policyname IN (
        'product_images_viewable_by_everyone',
        'Product images are viewable by everyone'
      )
    ) THEN
      CREATE POLICY product_images_viewable_by_everyone ON product_images
        FOR SELECT USING (true);
    END IF;
  END IF;
END$$;

-- Insertar filas de ejemplo solo si no existen
-- Busca productos por nombre y añade una imagen si no hay imágenes para ese producto
INSERT INTO product_images (product_id, image_url, position)
SELECT p.id, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop', 0
FROM products p
WHERE p.name = 'Parche F-18 Super Hornet'
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

INSERT INTO product_images (product_id, image_url, position)
SELECT p.id, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=800&fit=crop', 0
FROM products p
WHERE p.name = 'Camiseta Eurofighter Typhoon'
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

INSERT INTO product_images (product_id, image_url, position)
SELECT p.id, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=800&fit=crop', 0
FROM products p
WHERE p.name = 'Llavero F-18 Metálico'
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

INSERT INTO product_images (product_id, image_url, position)
SELECT p.id, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop', 0
FROM products p
WHERE p.name = 'Parche Escuadrón Ala 15'
  AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

COMMIT;
