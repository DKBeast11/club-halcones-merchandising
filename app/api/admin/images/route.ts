import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { requireAdmin, unauthorized } from '@/lib/auth/requireAdmin';
import { PRODUCTS_BUCKET as BUCKET } from '@/lib/storage';

// Estas rutas usan el cliente service_role, que salta RLS: la comprobación de
// quién llama la tienen que hacer ellas mismas, antes que nada.

// El catálogo entero vive en `Products` (lib/storage.ts). La ruta subía a un
// `product-images` aparte, que quedaba vacío y descolgado del resto.

// Los ids son UUID. Uno mal formado es un error de quien llama (400), no del
// servidor: antes llegaba a Postgres y volvía como 500.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const badProductId = () => NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return unauthorized();

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json([], { status: 200 });
  if (!UUID.test(productId)) return badProductId();

  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error('Error al listar las imágenes:', err);
    return NextResponse.json({ error: 'Error fetching images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return unauthorized();

  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const productId = form.get('productId') as string | null;
    const imageUrl = form.get('imageUrl') as string | null;

    // Dos flujos posibles: subir un archivo, o registrar una URL ya existente.
    if (!file && !imageUrl) {
      return NextResponse.json({ error: 'No file or image URL provided' }, { status: 400 });
    }
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    if (!UUID.test(productId)) return badProductId();

    let finalUrl = imageUrl ?? '';

    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}_${Date.now()}.${fileExt}`;

      const { data: buckets } = await supabaseAdmin.storage.listBuckets();

      if (!buckets?.some((b) => b.name === BUCKET)) {
        const { error: bucketError } = await supabaseAdmin.storage.createBucket(BUCKET, {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        });

        if (bucketError) {
          console.error('Error al crear el bucket:', bucketError);
          return NextResponse.json(
            { error: `Error creating storage bucket: ${bucketError.message}` },
            { status: 500 }
          );
        }
      }

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);
      finalUrl = publicData?.publicUrl ?? '';
    }

    // La nueva imagen va al final: se busca la posición más alta y se suma una.
    const { data: lastPositions } = await supabaseAdmin
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = lastPositions?.length ? (lastPositions[0].position ?? 0) + 1 : 1;

    const { data: created, error: insertError } = await supabaseAdmin
      .from('product_images')
      .insert([{ product_id: productId, image_url: finalUrl, position: nextPosition }])
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json(created);
  } catch (err) {
    console.error('Error al subir la imagen:', err);
    return NextResponse.json({ error: `Upload failed: ${err}` }, { status: 500 });
  }
}
