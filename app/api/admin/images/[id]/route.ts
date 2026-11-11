import { NextResponse } from 'next/server';
import { removeUnreferencedFiles, supabaseAdmin } from '@/lib/supabase/server';
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
      .select('id, image_url')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!img) return NextResponse.json({ error: 'Imagen no encontrada' }, { status: 404 });

    const { error: delError } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('id', id);

    if (delError) throw delError;

    // Antes solo se borraba la fila y el fichero se quedaba huérfano en el
    // bucket. Se borra después de la fila: si esto falla, sobra un fichero,
    // que es mejor que una fila apuntando a una imagen que ya no existe.
    // Ni las URLs externas ni los ficheros que use otra fila se tocan.
    await removeUnreferencedFiles([img.image_url]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar la imagen:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
