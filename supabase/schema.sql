-- Esquema de Club Halcones Merchandising.
--
-- Refleja la base de datos REAL, sacada de pg_catalog el 11-11-2026 (tablas,
-- columnas, restricciones, índices, triggers y políticas). Sirve para montar
-- un proyecto nuevo desde cero o para entender el actual. Los cambios
-- posteriores van en supabase/migrations/ y se copian también aquí.
--
-- Lo que había antes en este fichero describía el sistema de login artesanal
-- (admins con password_hash, sesiones propias) y ya no se parecía a la base
-- de datos.

-- ---------------------------------------------------------------------------
-- Categorías
-- ---------------------------------------------------------------------------

CREATE TABLE categories (
  -- Identificador en minúsculas y sin acentos: 'miscelanea'. Es lo que
  -- guarda products.category.
  id VARCHAR(50) PRIMARY KEY,
  -- Nombre presentable, con acentos: 'Miscelánea'.
  name VARCHAR(80) NOT NULL,
  -- Orden en la barra de filtros. Menor primero.
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO categories (id, name, position) VALUES
  ('parches',    'Parches',    1),
  ('camisetas',  'Camisetas',  2),
  ('llaveros',   'Llaveros',   3),
  ('miscelanea', 'Miscelánea', 4);

-- ---------------------------------------------------------------------------
-- Productos
-- ---------------------------------------------------------------------------

-- Sin columna image_url: las imágenes viven en product_images.
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL
    REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Hasta 5 por producto (lo limita la interfaz, no la base de datos).
-- Los ficheros están en el bucket público `Products` de Storage. Al borrar una
-- imagen o un producto, /api/admin/* borra también el fichero si ninguna otra
-- fila lo usa.
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_product_id_position ON product_images(product_id, position);

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------

-- Quién es admin. `uuid` es el id del usuario en Supabase Auth. Las políticas
-- de escritura de `products` miran aquí. Las altas se hacen a mano (SQL), no
-- desde la aplicación.
--
-- Además, /api/admin/* exige que el correo esté en la variable ADMIN_EMAILS.
CREATE TABLE admins (
  uuid UUID PRIMARY KEY,
  email VARCHAR NOT NULL,
  name VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Restos del login artesanal anterior a Supabase Auth. La aplicación ya no
-- la usa y está vacía. Se puede borrar junto con su política y la política
-- "Products are modifiable by admins only" de products.
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
--
-- Resumen: sin sesión solo se lee el catálogo. Con sesión de un usuario que
-- está en `admins`, se escribe en `products`. Lo demás (imágenes, categorías,
-- borrar productos con sus ficheros) pasa por /api/admin/*, que usa
-- service_role tras comprobar la sesión. No hay políticas de Storage: solo
-- service_role escribe en el bucket.

ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Las categorías se leen sin sesión" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY product_images_viewable_by_everyone ON product_images
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins
    WHERE admins.uuid = ((current_setting('request.jwt.claims', true))::json ->> 'sub')::uuid
  ));

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins
    WHERE admins.uuid = ((current_setting('request.jwt.claims', true))::json ->> 'sub')::uuid
  ));

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins
    WHERE admins.uuid = ((current_setting('request.jwt.claims', true))::json ->> 'sub')::uuid
  ));

-- Imprescindible para las tres de arriba: su subconsulta sobre `admins` se
-- evalúa con el RLS de `admins`, y sin esta política no veía ninguna fila.
-- Ver supabase/migrations/20261111_admins_select_own_row.sql.
CREATE POLICY "Cada usuario ve su propia fila de admins" ON admins
  FOR SELECT TO authenticated
  USING (uuid = auth.uid());

-- Legado: nunca se cumple (admin_sessions está vacía). Como las políticas se
-- combinan con OR, no concede ni quita nada.
CREATE POLICY "Products are modifiable by admins only" ON products
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM admin_sessions
    WHERE admin_sessions.session_token = (current_setting('request.jwt.claims', true))::json ->> 'session_token'
      AND admin_sessions.expires_at > NOW()
  ));

CREATE POLICY "Admins can view own sessions" ON admin_sessions
  FOR SELECT
  USING (
    (current_setting('request.jwt.claims', true))::json ->> 'session_token' = session_token
    AND expires_at > NOW()
  );
