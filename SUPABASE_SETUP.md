# 🚀 Configuración de Supabase - Club Halcones

## 📋 Pasos para Configurar Supabase

### **1. Crear Proyecto en Supabase**

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"**
3. Conecta con GitHub (recomendado)
4. Crea un nuevo proyecto:
   - **Name**: `club-halcones-merchandising`
   - **Database Password**: Genera una contraseña segura (guárdala)
   - **Region**: Elige la más cercana a ti
5. Espera a que se configure (2-3 minutos)

### **2. Obtener Credenciales**

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia las siguientes credenciales:
   - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
   - **anon public** key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role** key (SUPABASE_SERVICE_ROLE_KEY)

### **3. Configurar Variables de Entorno**

1. Crea el archivo `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edita `.env.local` con tus credenciales:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
   
   # Configuración local (fallback)
   NEXT_PUBLIC_ADMIN_PASSWORD=F18-Eurofighter-2024
   NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=10
   ```

### **4. Configurar Base de Datos**

1. Ve a **SQL Editor** en tu dashboard de Supabase
2. Copia y pega el contenido de `supabase/schema.sql`
3. Ejecuta el script para crear:
   - Tabla de productos
   - Tabla de administradores
   - Tabla de sesiones
   - Políticas de seguridad (RLS)
   - Datos iniciales

### **5. Configurar Almacenamiento (Opcional)**

Para subir imágenes de productos:

1. Ve a **Storage** en tu dashboard
2. Crea un bucket llamado `product-images`
3. Configura las políticas de acceso:
   ```sql
   -- Política para permitir lectura pública
   CREATE POLICY "Product images are publicly accessible" ON storage.objects
   FOR SELECT USING (bucket_id = 'product-images');
   
   -- Política para permitir subida solo a admins
   CREATE POLICY "Admins can upload product images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'product-images' AND
     auth.role() = 'authenticated'
   );
   ```

## 🔧 Configuración de la Aplicación

### **Actualizar Layout Principal**

El layout ya está configurado para usar Supabase. Solo necesitas:

1. **Reiniciar la aplicación**:
   ```bash
   npm run dev
   ```

2. **Verificar conexión**:
   - Abre la consola del navegador
   - Deberías ver logs de conexión a Supabase

### **Migrar Datos Existentes**

Si tienes datos en localStorage:

1. **Exportar datos**:
   - Abre DevTools (F12)
   - Ve a Application → Local Storage
   - Copia el contenido de `club-halcones-products`

2. **Importar a Supabase**:
   - Ve a **Table Editor** en Supabase
   - Añade los productos manualmente o usa la API

## 🎯 Funcionalidades con Supabase

### **✅ Ventajas de Supabase**

- **Base de datos real**: PostgreSQL con todas las funcionalidades
- **Autenticación robusta**: Sistema de usuarios y sesiones
- **Almacenamiento**: Subida de imágenes de productos
- **Tiempo real**: Actualizaciones automáticas
- **Seguridad**: Row Level Security (RLS)
- **Escalabilidad**: Crece con tu proyecto

### **🔄 Migración Gradual**

Puedes migrar gradualmente:

1. **Fase 1**: Solo productos (ya implementado)
2. **Fase 2**: Autenticación con Supabase Auth
3. **Fase 3**: Almacenamiento de imágenes
4. **Fase 4**: Funcionalidades avanzadas

## 🚨 Solución de Problemas

### **Error de Conexión**
- Verifica que las variables de entorno estén correctas
- Confirma que el proyecto de Supabase esté activo
- Revisa la consola del navegador para errores

### **Error de Permisos**
- Verifica que las políticas RLS estén configuradas
- Confirma que el usuario tenga los permisos correctos

### **Error de Esquema**
- Ejecuta el script SQL completo
- Verifica que todas las tablas se crearon correctamente

## 📊 Monitoreo

### **Dashboard de Supabase**
- **Database**: Monitorea consultas y rendimiento
- **Auth**: Gestiona usuarios y sesiones
- **Storage**: Controla archivos subidos
- **Logs**: Revisa errores y actividad

### **Métricas Importantes**
- Número de productos
- Usuarios activos
- Consultas por minuto
- Uso de almacenamiento

## 🔒 Seguridad

### **Políticas Implementadas**
- ✅ Lectura pública de productos
- ✅ Modificación solo para admins
- ✅ Sesiones con expiración
- ✅ Validación de datos

### **Recomendaciones**
- Cambia la contraseña del admin por defecto
- Usa HTTPS en producción
- Configura backup automático
- Monitorea logs de seguridad

---

**¡Con Supabase tu aplicación será más robusta y escalable!** 🚀
