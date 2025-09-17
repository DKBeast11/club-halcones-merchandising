-- Esquema de base de datos para Club Halcones Merchandising

-- Tabla de productos
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('parches', 'camisetas', 'llaveros')),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de administradores (para autenticación)
CREATE TABLE admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Tabla de sesiones de administrador
CREATE TABLE admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en products
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_sessions_expires ON admin_sessions(expires_at);

-- Políticas de seguridad (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Política para productos: todos pueden leer
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Política para productos: solo admins pueden modificar
CREATE POLICY "Products are modifiable by admins only" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_sessions 
      WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND expires_at > NOW()
    )
  );

-- Política para admins: solo pueden ver su propio perfil
CREATE POLICY "Admins can view own profile" ON admins
  FOR SELECT USING (
    id = (
      SELECT admin_id FROM admin_sessions 
      WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND expires_at > NOW()
    )
  );

-- Política para sesiones: solo pueden ver sus propias sesiones
CREATE POLICY "Admins can view own sessions" ON admin_sessions
  FOR SELECT USING (
    admin_id = (
      SELECT admin_id FROM admin_sessions 
      WHERE session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
      AND expires_at > NOW()
    )
  );

-- Insertar datos iniciales
INSERT INTO products (name, category, price, stock, image_url, description) VALUES
('Parche F-18 Super Hornet', 'parches', 12.99, 25, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop', 'Parche bordado oficial del F-18 Super Hornet'),
('Camiseta Eurofighter Typhoon', 'camisetas', 24.99, 15, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop', 'Camiseta negra con diseño del Eurofighter Typhoon'),
('Llavero F-18 Metálico', 'llaveros', 8.99, 3, 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop', 'Llavero metálico con forma de F-18'),
('Parche Escuadrón Ala 15', 'parches', 10.99, 0, 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop', 'Parche oficial del Escuadrón Ala 15');

-- Crear usuario administrador por defecto (contraseña: F18-Eurofighter-2024)
-- Nota: En producción, deberías usar un hash real de la contraseña
INSERT INTO admins (email, password_hash, name) VALUES
('admin@clubhalcones.com', '$2a$10$rQZ8K9mN2pL3sT4uV5wX6yA7bC8dE9fG0hI1jK2lM3nO4pQ5rS6tU7vW8xY9zA', 'Administrador Principal');
