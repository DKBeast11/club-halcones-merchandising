# Club Halcones · Merchandising

Catálogo de merchandising del Club Halcones (parches, camisetas, llaveros y
miscelánea), con un panel de administración para gestionar productos, stock e
imágenes.

Producción: https://club-halcones-merchandising.vercel.app

## Cómo está hecho

| Pieza | Qué |
|---|---|
| Interfaz | Next.js 15 (App Router), React 19, Tailwind 3, `lucide-react` |
| Datos | Supabase Postgres: `products`, `product_images`, `categories`, `admins` |
| Imágenes | Supabase Storage, bucket público `Products` |
| Acceso admin | Supabase Auth (correo y contraseña). El registro público está desactivado |
| Despliegue | Vercel, desde `main` |

- **Lectura**: el catálogo usa la anon key, y RLS solo deja leer.
- **Escritura de productos**: con la sesión del admin; RLS la permite a quien
  está en la tabla `admins`.
- **Imágenes y categorías**: pasan por `/api/admin/*`, que usa `service_role`
  y por eso comprueba antes la sesión (`lib/auth/requireAdmin.ts`) y la lista
  `ADMIN_EMAILS`.
- **`/api/keepalive`**: Vercel la llama a diario (`crons` en `vercel.json`)
  para que el plan gratuito de Supabase no pause el proyecto.

## Arrancar en local

```bash
cp env.example .env.local   # y rellenarlo; guardarlo en UTF-8, no UTF-16
npm install
npm run dev                 # http://localhost:3000
```

Otras órdenes:

```bash
npm run typecheck                 # tsc --noEmit
npm run build
node scripts/backup-catalog.mjs   # copia de tablas e imágenes en backups/
```

## Variables de entorno

Ver `env.example`. En Vercel tienen que estar las mismas;
`SUPABASE_SERVICE_ROLE_KEY` marcada como *Sensitive* y nunca con prefijo
`NEXT_PUBLIC_`.

## Base de datos

- `supabase/schema.sql`: esquema de referencia. **Ojo:** no coincide del todo
  con la base de datos real (ver el documento de traspaso).
- `supabase/migrations/`: cambios aplicados después.

## Estado del proyecto

El historial de decisiones, lo que queda pendiente y las trampas conocidas
están en
[`.artifacts/in-progress/2026-07-30-reorganizacion-y-rediseno.md`](.artifacts/in-progress/2026-07-30-reorganizacion-y-rediseno.md).
Léelo antes de tocar Supabase o Vercel.
