// Si un componente de cliente llega a importar este fichero, el build falla.
// Es la garantía de que la service_role no acaba en el navegador.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

// Cliente con service_role: salta RLS, así que cualquier ruta que lo use
// tiene que comprobar antes quién llama (lib/auth/requireAdmin.ts).
// La clave no lleva prefijo NEXT_PUBLIC_ a propósito: nunca debe llegar al
// navegador.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// null en vez de lanzar: sin la clave el catálogo funciona igual; solo dejan
// de funcionar las rutas de /api/admin, que responden 500 y lo dicen.
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null
