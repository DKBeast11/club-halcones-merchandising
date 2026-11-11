import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// El plan gratuito de Supabase pausa el proyecto tras unos días sin
// actividad, y con él cae el catálogo entero: el host deja hasta de resolver
// en DNS. Vercel llama a esta ruta una vez al día (ver `crons` en vercel.json)
// y basta una lectura mínima para que cuente como actividad.
//
// Usa el cliente anónimo y una tabla de lectura pública, así que no expone
// nada que el catálogo no muestre ya. Tampoco devuelve los datos: solo si
// la base de datos respondió.

// Sin esto Next prerenderizaría la ruta al compilar y el cron recibiría
// siempre la misma respuesta cacheada, sin tocar la base de datos.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await supabase.from('categories').select('id').limit(1);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
