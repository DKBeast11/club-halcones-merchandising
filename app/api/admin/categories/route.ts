import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, unauthorized } from '@/lib/auth/requireAdmin';
import { toSlug } from '@/lib/slug';

// Igual que /api/admin/images: usa el cliente service_role, que salta RLS, así
// que la comprobación de quién llama la hace la ruta, antes que nada.
//
// Leer las categorías no pasa por aquí: la tabla tiene una política de SELECT
// pública y el catálogo las pide con el cliente anónimo. Esta ruta existe solo
// para darlas de alta, que es lo que RLS no deja hacer sin service_role.

/** Tope de la columna `name`, que es VARCHAR(80). */
const MAX_NAME = 80;

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return unauthorized();

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const body = await request.json().catch(() => null);
    const rawName = typeof body?.name === 'string' ? body.name.trim() : '';

    if (!rawName) {
      return NextResponse.json(
        { error: 'El nombre de la categoría es obligatorio.' },
        { status: 400 }
      );
    }
    if (rawName.length > MAX_NAME) {
      return NextResponse.json(
        { error: `El nombre no puede pasar de ${MAX_NAME} caracteres.` },
        { status: 400 }
      );
    }

    const id = toSlug(rawName);
    // Un nombre que solo tenga signos ("¿?", "---") se queda sin identificador.
    if (!id) {
      return NextResponse.json(
        { error: 'El nombre tiene que llevar alguna letra o número.' },
        { status: 400 }
      );
    }

    // La nueva va al final de la barra de filtros.
    const { data: last } = await supabaseAdmin
      .from('categories')
      .select('position')
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([{ id, name: rawName, position: (last?.position ?? 0) + 1 }])
      .select()
      .single();

    if (error) {
      // 23505 es la violación de la clave primaria: ya existe ese identificador.
      // Puede pasar aunque el nombre se vea distinto, porque "Miscelánea" y
      // "miscelanea" producen el mismo id.
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre.' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error al crear la categoría:', err);
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 });
  }
}
