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
| Tests | Playwright Test (unitarios + e2e), GitHub Actions |
| Imágenes | Supabase Storage, bucket público `Products` |
| Acceso admin | Supabase Auth (correo y contraseña). El registro público está desactivado |
| Despliegue | Vercel, desde `main` |

- **Lectura**: el catálogo usa la anon key, y RLS solo deja leer.
- **Escritura de productos**: con la sesión del admin; RLS la permite a quien
  está en la tabla `admins`.
- **Imágenes, categorías y borrar productos**: pasan por `/api/admin/*`, que usa `service_role`
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

## Tests

Playwright Test para todo (unitarios sin navegador y e2e con navegador).

```bash
npm run test:unit    # lib/, ~3 s
npm run test:e2e     # lo que ve un visitante; solo lectura
npm run test:admin   # el panel de admin entero; escribe en la BD real
npm test             # unitarios + visitante
```

- Los e2e compilan la app y la levantan en el puerto 3100, contra el
  Supabase de `.env.local`.
- `test:admin` necesita `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` (una cuenta
  de Supabase Auth solo para tests) y **solo toca productos que crea él**,
  con nombre `E2E …`, que borra al terminar.
- La CI (GitHub Actions) corre tipos, lint, unitarios, build y e2e de
  visitante en cada push y PR.
- Cómo escribir tests nuevos y las trampas conocidas:
  `.claude/skills/tests/SKILL.md`.

## Variables de entorno

Ver `env.example`. En Vercel tienen que estar las mismas;
`SUPABASE_SERVICE_ROLE_KEY` marcada como *Sensitive* y nunca con prefijo
`NEXT_PUBLIC_`.

## Base de datos

- `supabase/schema.sql`: el esquema real (tablas, índices, RLS), sacado de
  la base de datos el 11-11-2026.
- `supabase/migrations/`: cambios aplicados después.

## Estado del proyecto

El historial de decisiones, lo que queda pendiente y las trampas conocidas
están en
[`.artifacts/in-progress/2026-07-30-reorganizacion-y-rediseno.md`](.artifacts/in-progress/2026-07-30-reorganizacion-y-rediseno.md).
Léelo antes de tocar Supabase o Vercel.
