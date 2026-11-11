# Club Halcones

Catálogo de merchandising: Next.js 15 + Supabase (Postgres, Auth, Storage),
desplegado en Vercel desde `main`.

- **Estado, decisiones y trampas conocidas**:
  `.artifacts/in-progress/2026-07-30-reorganizacion-y-rediseno.md`. Léelo
  antes de tocar Supabase, Vercel o RLS.
- **Tests**: skill `tests` (`.claude/skills/tests/SKILL.md`). Todo cambio de
  código va con su test, y todo bug arreglado con su test de regresión.
- **Antes de dar algo por terminado**: `npm run typecheck`, `npm run lint` y
  `npm test`. Si has tocado el panel de admin, `/api/admin/*`, `CatalogContext`
  o RLS, también `npm run test:admin`.
- Los e2e usan el **Supabase de producción**. Los de admin solo pueden tocar
  productos que empiecen por `E2E `.
- Cambios de esquema o de políticas: archivo en `supabase/migrations/` y
  también en `supabase/schema.sql`, que refleja la base de datos real.
