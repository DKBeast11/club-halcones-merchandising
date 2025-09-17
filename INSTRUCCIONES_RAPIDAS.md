# 🚀 Instrucciones Rápidas - Club Halcones

## ⚡ Configuración en 3 Pasos

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar contraseña de admin
```bash
# Crear archivo .env.local
echo "NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_aqui" > .env.local
echo "NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=10" >> .env.local
```

### 3. Ejecutar aplicación
```bash
npm run dev
```

## 🔑 Acceso de Administrador

- **URL**: http://localhost:3000
- **Botón**: "Admin Login" (esquina superior derecha)
- **Contraseña por defecto**: `F18-Eurofighter-2024`
- **Logout automático**: 10 minutos de inactividad

## 📱 Funcionalidades

### Para Usuarios
- ✅ Ver catálogo de productos
- ✅ Buscar y filtrar productos
- ✅ Ver stock disponible

### Para Administradores
- ✅ Añadir nuevos productos
- ✅ Modificar stock (+1, -1, +10)
- ✅ Eliminar productos
- ✅ Gestión completa del inventario

## 🛡️ Seguridad

- **Contraseña configurable** via `.env.local`
- **Logout automático** por inactividad
- **Indicador visual** de tiempo de sesión
- **Persistencia** de sesión al recargar

## 🔧 Cambiar Contraseña

1. Edita `.env.local`
2. Cambia `NEXT_PUBLIC_ADMIN_PASSWORD`
3. Reinicia con `npm run dev`

---

**¡Listo! Tu catálogo de merchandising está funcionando** 🛩️
