# Club Halcones - Merchandising Oficial

Una aplicación web moderna para la gestión de catálogo de merchandising del Club Halcones, especializada en productos de F-18 y Eurofighter.

## 🚀 Características

- **Catálogo de Productos**: Visualización completa de parches, camisetas y llaveros
- **Panel de Administración**: Gestión completa de productos e inventario
- **Búsqueda y Filtros**: Sistema de búsqueda por nombre/descripción y filtros por categoría
- **Gestión de Stock**: Control de inventario en tiempo real
- **Diseño Responsivo**: Optimizado para dispositivos móviles y desktop
- **Persistencia Local**: Los datos se guardan automáticamente en el navegador

## 🛠️ Tecnologías

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos y diseño responsivo
- **Lucide React** - Iconos modernos
- **Context API** - Gestión de estado

## 📱 Funcionalidades

### Para Usuarios
- Navegación por catálogo de productos
- Búsqueda de productos por nombre o descripción
- Filtrado por categorías (Parches, Camisetas, Llaveros)
- Visualización de stock disponible
- Interfaz optimizada para móviles

### Para Administradores
- Modo administrador con contraseña visual
- Añadir nuevos productos al catálogo
- Editar información de productos existentes
- Control de stock (aumentar/disminuir inventario)
- Eliminar productos del catálogo
- Gestión de imágenes y descripciones

## 🚀 Instalación y Uso

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   ```bash
   # Copia el archivo de ejemplo
   cp env.example .env.local
   
   # Edita .env.local con tus valores
   # NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_secreta
   # NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=10
   ```

3. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador**:
   ```
   http://localhost:3000
   ```

5. **Compilar para producción**:
   ```bash
   npm run build
   npm start
   ```

## 🔐 Sistema de Autenticación

### Configuración de Seguridad
- **Contraseña por defecto**: `F18-Eurofighter-2024`
- **Logout automático**: 10 minutos de inactividad
- **Persistencia**: La sesión se mantiene al recargar la página
- **Seguridad**: Contraseña configurable via variables de entorno

### Para Cambiar la Contraseña
1. Edita el archivo `.env.local`
2. Cambia `NEXT_PUBLIC_ADMIN_PASSWORD` por tu nueva contraseña
3. Reinicia la aplicación

### Características de Seguridad
- ✅ Contraseña oculta en el campo de entrada
- ✅ Logout automático por inactividad
- ✅ Indicador visual de tiempo restante
- ✅ Limpieza automática de datos al cerrar sesión
- ✅ Validación de sesión al cargar la página

## 📁 Estructura del Proyecto

```
├── app/                    # Páginas de Next.js
│   ├── globals.css        # Estilos globales
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página principal
├── components/            # Componentes React
│   ├── AdminPanel.tsx     # Panel de administración
│   ├── Header.tsx         # Cabecera de la aplicación
│   ├── MerchandiseCatalog.tsx # Componente principal
│   ├── ProductCard.tsx    # Tarjeta de producto
│   ├── ProductGrid.tsx    # Grid de productos
│   └── SearchAndFilters.tsx # Búsqueda y filtros
├── context/               # Context API
│   └── ProductContext.tsx # Contexto de productos
├── types/                 # Tipos TypeScript
│   └── index.ts          # Definiciones de tipos
└── README.md             # Este archivo
```

## 🎨 Diseño

La aplicación utiliza un diseño moderno con:
- **Tema oscuro** para mejor experiencia visual
- **Colores de aviación** (azules y grises)
- **Iconos de aviones** para mantener la temática
- **Animaciones suaves** para mejor UX
- **Diseño responsivo** que se adapta a cualquier dispositivo

## 📊 Gestión de Datos

- Los productos se almacenan en **localStorage** del navegador
- **Persistencia automática** de cambios
- **Validación de datos** en formularios
- **Estados de stock** (disponible, stock bajo, agotado)

## 🔧 Personalización

### Añadir Nuevas Categorías
1. Editar el array `categories` en `SearchAndFilters.tsx`
2. Actualizar el tipo `Product` en `types/index.ts`
3. Añadir opciones en el formulario de `AdminPanel.tsx`

### Modificar Estilos
- Los estilos se encuentran en `app/globals.css`
- Utiliza clases de Tailwind CSS
- Colores personalizados en `tailwind.config.js`

## 📱 Optimización Móvil

- **Touch-friendly**: Botones y elementos optimizados para táctil
- **Grid responsivo**: Se adapta de 1 a 4 columnas según el dispositivo
- **Navegación intuitiva**: Fácil acceso a todas las funciones
- **Carga rápida**: Optimizado para conexiones móviles

## 🚀 Próximas Mejoras

- [ ] Sistema de autenticación real
- [ ] Base de datos backend
- [ ] Sistema de pedidos
- [ ] Integración con pasarela de pago
- [ ] Panel de estadísticas
- [ ] Notificaciones push
- [ ] Modo offline

## 📄 Licencia

Este proyecto es propiedad del Club Halcones y está destinado para uso interno.

---

**Club Halcones** - Merchandising Oficial F-18 & Eurofighter 🛩️

