# 🚀 GUÍA COMPLETA PARA DESPLEGAR EN VERCEL

## ✅ Preparación completada
- ✅ Proyecto configurado para producción
- ✅ TypeScript corregido
- ✅ Build exitoso
- ✅ Código subido a GitHub

## 🌐 SIGUIENTES PASOS EN VERCEL:

### PASO 1: Acceso a Vercel
1. Ve a: https://vercel.com
2. Haz clic en "Login"
3. Selecciona "Continue with GitHub"
4. Autoriza Vercel si es necesario

### PASO 2: Crear nuevo proyecto
1. Haz clic en "New Project" (botón azul)
2. En "Import Git Repository":
   - Busca: "club-halcones-merchandising"
   - Haz clic en "Import" junto al repositorio

### PASO 3: Configuración del proyecto
**Framework Preset:** Next.js (se detectará automáticamente)
**Root Directory:** ./ (por defecto)
**Build Command:** npm run build (por defecto)
**Output Directory:** .next (por defecto)
**Install Command:** npm install (por defecto)

### PASO 4: Variables de entorno ⚠️ IMPORTANTE
En la sección "Environment Variables", agrega EXACTAMENTE estas 4 variables:

**Variable 1:**
- Name: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://abvziolumaqmacbfweci.supabase.co`

**Variable 2:**
- Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFidnppb2x1bWFxbWFjYmZ3ZWNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzc3MjQsImV4cCI6MjA3MzcxMzcyNH0.PuVRdPfqX0B9fH-pF3Y2V8FT7eAZYyV9vNxmofZr8Fk`

**Variable 3:**
- Name: `NEXT_PUBLIC_ADMIN_PASSWORD`
- Value: `F18-Eurofighter-2024`

**Variable 4:**
- Name: `NEXT_PUBLIC_AUTO_LOGOUT_MINUTES`
- Value: `10`

### PASO 5: Deploy
1. Haz clic en "Deploy" (botón azul)
2. Espera 2-3 minutos mientras se construye
3. ¡Tu página estará lista!

## 🎉 DESPUÉS DEL DEPLOY:

### Vercel te dará:
- **URL de producción:** algo como `https://club-halcones-merchandising.vercel.app`
- **URL de preview:** para cada commit
- **Dashboard** para monitoreo

### Configuración automática:
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Deploy automático en cada push a main
- ✅ Preview deployments en PRs

## 🔧 DESPUÉS DE DEPLOYAR:

### 1. Configura dominio personalizado (opcional)
- Ve al dashboard de Vercel
- Settings → Domains
- Agrega tu dominio si tienes uno

### 2. Verifica funcionalidad
- ✅ Página principal carga
- ✅ Productos se muestran desde Supabase
- ✅ Panel de admin funciona
- ✅ Imágenes se cargan correctamente

### 3. Monitoreo
- Dashboard de Vercel para analytics
- Logs de errores
- Performance metrics

## 📱 URLs importantes:
- **Dashboard:** https://vercel.com/dashboard
- **Documentación:** https://vercel.com/docs
- **Status:** https://vercel-status.com

¡Tu tienda del Club Halcones estará en línea en unos minutos! 🛩️