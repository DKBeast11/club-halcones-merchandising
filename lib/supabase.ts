import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia env.example a .env.local y rellénalas. ' +
      'Importante: guarda .env.local en UTF-8, no en UTF-16, o Next no podrá leerlo.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente con service_role para operaciones de servidor: salta RLS, así que
// cualquier ruta que lo use tiene que comprobar por su cuenta quién llama.
// La clave no lleva prefijo NEXT_PUBLIC_ a propósito: nunca debe llegar al
// navegador.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null
