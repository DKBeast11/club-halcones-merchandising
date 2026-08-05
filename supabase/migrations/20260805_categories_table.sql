-- Las categorías pasan de ser un CHECK a ser una tabla.
--
-- Hasta ahora `products.category` estaba cerrado por
-- CHECK (category IN ('parches','camisetas','llaveros','miscelanea')).
-- El panel de administración ofrece "+ Crear nueva categoría", pero la fila
-- la rechazaba la base de datos con products_category_check, así que la
-- opción nunca llegó a funcionar.
--
-- Se sustituye el CHECK por una clave ajena a `categories`. Así se mantiene la
-- integridad (no se cuela una categoría por una errata) pero se pueden dar de
-- alta nuevas sin tocar el código, y cada una lleva su nombre presentable y su
-- orden en la barra de filtros.

CREATE TABLE IF NOT EXISTS categories (
  -- El id es el identificador que ya guarda products.category: minúsculas y
  -- sin acentos. Se mantiene para no tener que reescribir las 24 filas.
  id VARCHAR(50) PRIMARY KEY,
  -- Lo que ve la gente. Aquí sí van acentos y mayúsculas.
  name VARCHAR(80) NOT NULL,
  -- Orden en la barra de filtros. Menor primero.
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Las cuatro de siempre, con el nombre que ya mostraba SearchAndFilters.
INSERT INTO categories (id, name, position) VALUES
  ('parches',    'Parches',    1),
  ('camisetas',  'Camisetas',  2),
  ('llaveros',   'Llaveros',   3),
  ('miscelanea', 'Miscelánea', 4)
ON CONFLICT (id) DO NOTHING;

-- Red de seguridad: si hubiera algún producto con una categoría que no esté en
-- la tabla, la clave ajena fallaría al crearse. Se dan de alta antes, usando el
-- propio identificador como nombre, para que la migración no se atasque.
INSERT INTO categories (id, name, position)
SELECT DISTINCT p.category, initcap(p.category), 99
FROM products p
WHERE p.category IS NOT NULL
ON CONFLICT (id) DO NOTHING;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

ALTER TABLE products
  ADD CONSTRAINT products_category_fkey
  FOREIGN KEY (category) REFERENCES categories(id)
  -- Renombrar el identificador de una categoría arrastra a sus productos.
  ON UPDATE CASCADE
  -- Y no se puede borrar una categoría que todavía tenga productos dentro.
  ON DELETE RESTRICT;

-- El catálogo es público, así que la lista de categorías también tiene que
-- poder leerse sin sesión. Escribir es otra cosa: no se crea ninguna política
-- de escritura, de modo que solo pasa el cliente service_role (que salta RLS)
-- desde /api/admin/categories, que a su vez exige sesión de admin.
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Las categorías se leen sin sesión" ON categories;
CREATE POLICY "Las categorías se leen sin sesión"
  ON categories FOR SELECT
  USING (true);
