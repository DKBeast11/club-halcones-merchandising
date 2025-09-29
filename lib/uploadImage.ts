export async function uploadFileToStorage(file: File): Promise<string> {
  try {
    const { supabase } = await import('./supabase');
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: publicData } = await supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicData?.publicUrl || '';
  } catch (err) {
    console.error('uploadFileToStorage error', err);
    throw err;
  }
}
