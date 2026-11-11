// Si un componente de cliente llega a importar este fichero, el build falla.
// Es la garantía de que la service_role no acaba en el navegador.
import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { PRODUCTS_BUCKET, storagePathFromPublicUrl } from '@/lib/storage'

// Cliente con service_role: salta RLS, así que cualquier ruta que lo use
// tiene que comprobar antes quién llama (lib/auth/requireAdmin.ts).
// La clave no lleva prefijo NEXT_PUBLIC_ a propósito: nunca debe llegar al
// navegador.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// null en vez de lanzar: sin la clave el catálogo funciona igual; solo dejan
// de funcionar las rutas de /api/admin, que responden 500 y lo dicen.
export const supabaseAdmin =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

/**
 * Borra del bucket los ficheros de estas URLs que ya no use ninguna fila de
 * product_images. Se llama después de borrar las filas.
 *
 * La comprobación importa: un producto dado de alta "por URL" puede apuntar
 * al fichero de otro, y borrar el primero no puede dejar sin foto al segundo.
 * Las URLs externas (no del bucket) se ignoran.
 */
export async function removeUnreferencedFiles(imageUrls: string[]) {
  if (!supabaseAdmin) return;
  const candidates = Array.from(new Set(imageUrls)).filter((u) => storagePathFromPublicUrl(u));
  if (!candidates.length) return;

  const { data: stillUsed, error } = await supabaseAdmin
    .from('product_images')
    .select('image_url')
    .in('image_url', candidates);
  if (error) {
    // Ante la duda no se borra nada: sobra un fichero, no falta una foto.
    console.error('No se ha podido comprobar qué ficheros siguen en uso:', error);
    return;
  }
  const used = new Set((stillUsed ?? []).map((r) => r.image_url));
  const paths = candidates
    .filter((u) => !used.has(u))
    .map((u) => storagePathFromPublicUrl(u)!);
  if (!paths.length) return;

  const { error: storageError } = await supabaseAdmin.storage.from(PRODUCTS_BUCKET).remove(paths);
  if (storageError) console.error('No se han podido borrar los ficheros:', paths, storageError);
}
