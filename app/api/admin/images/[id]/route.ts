import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  const id = params.id;
  try {
    // Find record to get filename (if needed)
    const { data: img, error: fetchError } = await supabaseAdmin
      .from('product_images')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Optionally delete from storage (try to derive filename from URL)
    // Here we simply delete DB record
    const { error: delError } = await supabaseAdmin.from('product_images').delete().eq('id', id);
    if (delError) throw delError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
