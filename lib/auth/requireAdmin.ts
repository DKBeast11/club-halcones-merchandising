/**
 * Verificación de administrador para las rutas de /api/admin.
 *
 * Contexto de por qué está hecho así (comprobado el 30-07-2026 contra el
 * proyecto real; revisado el 11-11-2026):
 *
 * - La autoridad es **Supabase Auth**: se valida el token contra Supabase.
 *   La tabla `admins` la usan las políticas RLS de `products`, no esta
 *   función: las rutas de /api/admin usan service_role, que salta RLS.
 * - En el proyecto está **desactivado el registro público** ("Allow new users
 *   to sign up" = off). Solo hay dos usuarios: el admin y la cuenta de los
 *   tests e2e. El conjunto de quien puede autenticarse es cerrado.
 *
 * Ese segundo punto es la invariante de la que depende la seguridad de esto.
 * Si algún día se reactiva el registro público, "estar autenticado" dejaría de
 * significar "ser admin": para eso está `ADMIN_EMAILS`, que cierra la lista de
 * forma explícita y no depende de ningún estado en la base de datos.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Lista blanca opcional. Si está vacía, vale cualquier usuario autenticado. */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export interface AdminUser {
  id: string;
  email: string;
}

/**
 * Devuelve el usuario si la petición trae una sesión válida de un admin, o
 * `null` en cualquier otro caso. Ante la duda, deniega.
 */
export async function requireAdmin(request: Request): Promise<AdminUser | null> {
  if (!SUPABASE_URL || !ANON_KEY) return null;

  const header = request.headers.get('authorization');
  const token = header?.toLowerCase().startsWith('bearer ')
    ? header.slice(7).trim()
    : null;

  if (!token) return null;

  try {
    // Se valida contra Supabase en vez de descodificar el JWT por nuestra
    // cuenta: así se comprueban firma, caducidad y revocación de la sesión.
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const user = await res.json();
    const email: string | undefined = user?.email;

    if (!user?.id || !email) return null;

    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email.toLowerCase())) {
      return null;
    }

    return { id: user.id, email };
  } catch (err) {
    console.error('No se ha podido verificar la sesión:', err);
    return null;
  }
}

/** Respuesta estándar cuando la verificación falla. */
export function unauthorized() {
  return Response.json({ error: 'No autorizado' }, { status: 401 });
}
