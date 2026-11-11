/** Bucket donde vive todo el catálogo. Público desde el 30-07-2026. */
export const PRODUCTS_BUCKET = 'Products';

/**
 * Ruta del objeto dentro del bucket a partir de su URL pública, o `null` si
 * la URL no es de ese bucket (una imagen externa dada por URL, por ejemplo).
 *
 *   https://x.supabase.co/storage/v1/object/public/Products/PARCHES/a%20b.png
 *   → "PARCHES/a b.png"
 */
export function storagePathFromPublicUrl(url: string, bucket = PRODUCTS_BUCKET): string | null {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  const prefix = `/storage/v1/object/public/${bucket}/`;
  if (!pathname.startsWith(prefix)) return null;
  const path = decodeURIComponent(pathname.slice(prefix.length));
  return path || null;
}
