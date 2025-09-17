# 🔐 Configuración de Seguridad - Club Halcones

## Configuración Inicial

### 1. Crear archivo de variables de entorno

Crea un archivo llamado `.env.local` en la raíz del proyecto con el siguiente contenido:

```bash
# Contraseña de administrador (CAMBIA ESTA CONTRASEÑA)
NEXT_PUBLIC_ADMIN_PASSWORD=tu_contraseña_super_secreta_aqui

# Tiempo de inactividad para logout automático (en minutos)
NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=10
```

### 2. Configuración Recomendada para Producción

```bash
# Ejemplo de configuración segura
NEXT_PUBLIC_ADMIN_PASSWORD=ClubHalcones2024!F18-Eurofighter
NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=15
```

## 🔒 Características de Seguridad Implementadas

### ✅ Autenticación
- **Contraseña maestra** configurable
- **Campo de contraseña oculto** con opción de mostrar/ocultar
- **Validación en tiempo real** con mensajes de error
- **Login con Enter** para mejor UX

### ✅ Gestión de Sesión
- **Persistencia en localStorage** (se mantiene al recargar)
- **Logout automático** tras 10 minutos de inactividad
- **Detección de actividad** (mouse, teclado, scroll, touch)
- **Indicador visual** del tiempo restante de sesión

### ✅ Seguridad de Datos
- **Limpieza automática** de datos al cerrar sesión
- **Validación de sesión** al cargar la página
- **Protección contra sesiones expiradas**
- **Cierre automático** de formularios al logout

## 🎯 Flujo de Autenticación

1. **Usuario hace clic en "Admin Login"**
2. **Se abre modal de login** con campo de contraseña
3. **Usuario introduce contraseña** y presiona Enter o clic en "Iniciar Sesión"
4. **Sistema valida contraseña** contra variable de entorno
5. **Si es correcta**: Se abre sesión y aparece panel de administración
6. **Si es incorrecta**: Muestra error y limpia campo
7. **Sesión se mantiene** hasta logout manual o automático por inactividad

## ⚠️ Importante para Producción

### Cambiar Contraseña por Defecto
La contraseña por defecto es `F18-Eurofighter-2024`. **DEBES cambiarla** antes de usar en producción:

1. Edita `.env.local`
2. Cambia `NEXT_PUBLIC_ADMIN_PASSWORD` por una contraseña segura
3. Reinicia la aplicación

### Ejemplo de Contraseña Segura
```bash
NEXT_PUBLIC_ADMIN_PASSWORD=ClubHalcones2024!F18-Eurofighter-Secure
```

### Variables de Entorno en Producción
- **Vercel**: Añade las variables en el dashboard de Vercel
- **Netlify**: Configura en Site Settings > Environment Variables
- **Otros hosts**: Consulta la documentación de tu proveedor

## 🛡️ Recomendaciones de Seguridad

1. **Usa contraseñas complejas** (mínimo 12 caracteres)
2. **Combina letras, números y símbolos**
3. **No compartas la contraseña** por email o chat
4. **Cambia la contraseña regularmente**
5. **Usa HTTPS** en producción
6. **Considera autenticación de dos factores** para mayor seguridad

## 🔧 Personalización

### Cambiar Tiempo de Logout
```bash
# Para 15 minutos
NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=15

# Para 30 minutos
NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=30
```

### Desactivar Logout Automático
```bash
# Para desactivar (no recomendado)
NEXT_PUBLIC_AUTO_LOGOUT_MINUTES=0
```

## 🚨 Solución de Problemas

### "Contraseña incorrecta" siempre
- Verifica que `.env.local` existe
- Confirma que la variable `NEXT_PUBLIC_ADMIN_PASSWORD` está bien escrita
- Reinicia la aplicación después de cambiar variables

### Sesión se cierra muy rápido
- Verifica `NEXT_PUBLIC_AUTO_LOGOUT_MINUTES`
- Asegúrate de que el valor es un número válido

### No se guarda la sesión
- Verifica que localStorage está habilitado en el navegador
- Comprueba que no hay bloqueadores de cookies/localStorage

---

**Recuerda**: La seguridad es responsabilidad del administrador. Mantén las contraseñas seguras y actualiza regularmente.
