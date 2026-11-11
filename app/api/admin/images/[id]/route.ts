import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, unauthorized } from '@/lib/auth/requireAdmin';

// En Next 15 los params de una ruta dinámica llegan como Promise.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin(request))) return unauthorized();

  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const { id } = await params;

  try {
    const { data: img, error: fetchError } = await supabaseAdmin
      .from('product_images')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!img) return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });

    // Solo se borra el registro. El archivo sigue en el bucket: limpiarlo
    // requiere derivar el nombre desde la URL pública, pendiente de hacer.
    const { error: delError } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', id);

    if (delError) throw delError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar la imagen:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
