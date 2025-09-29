# Aplicar migración `product_images` en Supabase

Este documento describe 3 formas sencillas de aplicar la migración SQL creada en `supabase/migrations/20250929_create_product_images.sql` a tu proyecto de Supabase.

IMPORTANTE: la migración crea una tabla `product_images` y políticas. Haz una copia de seguridad antes de ejecutar en producción.

Opción A — Pegar en SQL Editor (rápido, manual)
1. Abre tu proyecto en https://app.supabase.com
2. Ve a "SQL Editor" → "New Query".
3. Abre `supabase/migrations/20250929_create_product_images.sql` en tu editor local y copia todo el contenido.
4. Pega en el editor de Supabase y haz click en "Run".
5. Verifica en la sección "Table Editor" que la tabla `product_images` existe y que las filas de ejemplo fueron añadidas.

Opción B — Usar Supabase CLI (recomendado para infra reproducible)
Requisitos: Node.js y Supabase CLI instalados (https://supabase.com/docs/guides/cli)

1. Instala la CLI (si no la tienes):

PowerShell:
```powershell
npm install -g supabase
```

2. Inicia sesión en la CLI:

```powershell
supabase login
```

3. Conéctate a tu proyecto (obtener PROJECT_REF desde el panel de Supabase) o inicia con `supabase link`:

```powershell
supabase link --project-ref <PROJECT_REF>
```

4. Aplica el SQL con `db remote` o `db push` (dependiendo de tu flujo). Ejemplo simple usando `supabase db remote commit` (dependiendo de la versión CLI):

```powershell
# Ejecuta el archivo SQL directamente contra el remote
supabase db remote exec "c:\Users\Alexi\Desktop\PROYECTOS\Club Halcones\supabase\migrations\20250929_create_product_images.sql"
```

Nota: la sintaxis exacta puede variar con la versión de la CLI; si prefieres, usa `psql` (Opción C) con la connection string.

Opción C — Usar psql (directo con connection string)
1. Obtén la connection string desde el panel de Supabase (Settings → Database → Connection string).
2. Desde PowerShell ejecuta:

```powershell
$CONN = "postgres://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/postgres"
psql $CONN -f "c:\Users\Alexi\Desktop\PROYECTOS\Club Halcones\supabase\migrations\20250929_create_product_images.sql"
```

(Alternativamente, si tienes `psql` en PATH):
```powershell
psql "postgres://<DB_USER>:<DB_PASS>@<DB_HOST>:5432/postgres" -f "c:\Users\Alexi\Desktop\PROYECTOS\Club Halcones\supabase\migrations\20250929_create_product_images.sql"
```

Verificaciones post-migración
- Verifica que la tabla `product_images` aparece en Table Editor.
- Haz un `SELECT * FROM product_images LIMIT 10;` en SQL Editor para ver las filas.
- Si usas RLS y políticas de seguridad estrictas, revisa que la política creada se ajusta a tus necesidades.

Rollback (manual)
- Para revertir la migración, puedes ejecutar:

```sql
DROP TABLE IF EXISTS product_images CASCADE;
```

Notas de seguridad
- No compartas claves de servicio (service_role) en el cliente. Para operaciones administrativas de subida/eliminación masiva, usa funciones server-side o la `supabase` con `service_role` en un entorno seguro.

Si quieres, aplico la migración por ti (necesito que pegues la SQL en el SQL editor de Supabase o me des acceso/creds, lo cual no es recomendable). También puedo generar un script PowerShell más robusto para usar con `psql` si me das la connection string en una variable local (no la pegues aquí en la conversación pública).