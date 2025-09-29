import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  if (!productId) return NextResponse.json([], { status: 200 });

  try {
    if (!supabaseAdmin) throw new Error('supabaseAdmin not configured');
    const resp: any = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('position', { ascending: true });

    return NextResponse.json(resp.data || []);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error fetching images' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

  try {
    const form = await request.formData();
    const file = form.get('file') as unknown as File;
    const productId = form.get('productId') as string;

    console.log('Received file:', file ? file.name : 'no file');
    console.log('Product ID:', productId);

    // Support two flows: upload a file OR insert an existing image URL
    const imageUrl = form.get('imageUrl') as string | null;

    if (!file && !imageUrl) {
      console.log('No file or imageUrl provided');
      return NextResponse.json({ error: 'No file or image URL provided' }, { status: 400 });
    }

    if (!productId) {
      console.log('No productId provided');
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    let finalUrl = imageUrl || '';

    if (file) {
      console.log('Processing file upload...');
      const fileExt = (file as any).name.split('.').pop();
      const fileName = `${productId}_${Date.now()}.${fileExt}`;

      console.log('Uploading to bucket: product-images, filename:', fileName);
      
      // Verificar si el bucket existe o crearlo
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      console.log('Available buckets:', buckets?.map(b => b.name));
      
      if (!buckets?.find(b => b.name === 'product-images')) {
        console.log('Creating product-images bucket...');
        const { error: bucketError } = await supabaseAdmin.storage.createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        });
        
        if (bucketError) {
          console.error('Error creating bucket:', bucketError);
          return NextResponse.json({ error: `Error creating storage bucket: ${bucketError.message}` }, { status: 500 });
        }
      }

      const uploadResp: any = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, file as any);
      
      if (uploadResp.error) {
        console.error('Storage upload error:', uploadResp.error);
        throw uploadResp.error;
      }

      const publicResp: any = await supabaseAdmin.storage.from('product-images').getPublicUrl(fileName);
      finalUrl = publicResp.data?.publicUrl || publicResp.publicUrl || '';
      console.log('File uploaded, URL:', finalUrl);
    }

    // Get current max position for this product
    const positionResp: any = await supabaseAdmin
      .from('product_images')
      .select('position')
      .eq('product_id', productId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = positionResp.data && positionResp.data.length > 0 
      ? (positionResp.data[0].position || 0) + 1 
      : 1;

    console.log('Next position:', nextPosition);

    // Insert DB record with position
    const insertResp: any = await supabaseAdmin
      .from('product_images')
      .insert([{ 
        product_id: productId, 
        image_url: finalUrl,
        position: nextPosition
      }])
      .select()
      .single();

    if (insertResp.error) {
      console.error('Database insert error:', insertResp.error);
      throw insertResp.error;
    }

    console.log('Image record created:', insertResp.data);
    return NextResponse.json(insertResp.data);
  } catch (err) {
    console.error('Upload process error:', err);
    return NextResponse.json({ error: `Upload failed: ${err}` }, { status: 500 });
  }
}
