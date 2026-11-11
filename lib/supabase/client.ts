import { createClient } from '@supabase/supabase-js'

// Cliente con la anon key. Vale en el navegador y en el servidor: es pública
// por diseño y RLS solo le deja leer el catálogo. Lo que escribe con él el
// panel de administración lo autoriza la sesión de Supabase Auth del admin,
// no la clave.
//
// El cliente con service_role vive aparte, en ./server.ts, para que no pueda
// colarse en el bundle del navegador.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Se falla en el build en vez de arrancar con valores por defecto: al ser
// variables NEXT_PUBLIC_ se incrustan al compilar, así que si faltan aquí la
// aplicación quedaría rota en tiempo de ejecución igualmente. Mejor enterarse
// antes de desplegar.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.\n' +
      '  · En local: copia env.example a .env.local y rellénalas. ' +
      'Guárdalo en UTF-8, no en UTF-16, o Next no podrá leerlo.\n' +
      '  · En Vercel: Settings > Environment Variables. Márcalas para TODOS ' +
      'los entornos (Production, Preview y Development), no solo Production, ' +
      'o las ramas fallarán al construir.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
