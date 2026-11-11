import { NextResponse } from 'next/server';
import { removeUnreferencedFiles, supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, unauthorized } from '@/lib/auth/requireAdmin';

// Borrar un producto con sus imágenes.
//
// Antes el panel borraba la fila directamente con la sesión del admin: las
// filas de product_images se iban en cascada, pero los ficheros se quedaban
// huérfanos en el bucket, porque con esa sesión no se pueden borrar (no hay
// políticas de Storage). Aquí se hace con service_role, así que primero se
// comprueba quién llama.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin(request))) return unauthorized();
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });

  try {
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('product_images')
      .select('image_url')
      .eq('product_id', id);
    if (imagesError) throw imagesError;

    const { data: deleted, error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)
      .select('id');
    if (deleteError) throw deleteError;
    if (!deleted?.length) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });

    // Después de la fila, como en el borrado de una imagen: si esto falla
    // sobra un fichero, que es mejor que un producto apuntando a nada.
    await removeUnreferencedFiles((images ?? []).map((i) => i.image_url));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error al borrar el producto:', err);
    return NextResponse.json({ error: 'No se ha podido borrar el producto.' }, { status: 500 });
  }
}
