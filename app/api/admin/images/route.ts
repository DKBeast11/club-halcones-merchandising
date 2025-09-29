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

    // Support two flows: upload a file OR insert an existing image URL
    const imageUrl = form.get('imageUrl') as string | null;

    if (!file && !imageUrl) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    let finalUrl = imageUrl || '';

    if (file) {
      const fileExt = (file as any).name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const uploadResp: any = await supabaseAdmin.storage
        .from('product-images')
        .upload(fileName, file as any);
      if (uploadResp.error) throw uploadResp.error;

      const publicResp: any = await supabaseAdmin.storage.from('product-images').getPublicUrl(fileName);
      finalUrl = publicResp.data?.publicUrl || publicResp.publicUrl || '';
    }

    // Insert DB record
    const insertResp: any = await supabaseAdmin
      .from('product_images')
      .insert([{ product_id: productId, image_url: finalUrl }])
      .select()
      .single();

    if (insertResp.error) throw insertResp.error;

    return NextResponse.json(insertResp.data);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
