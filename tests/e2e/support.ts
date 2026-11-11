import zlib from 'node:zlib';
import { createClient } from '@supabase/supabase-js';
import { PRODUCTS_BUCKET, storagePathFromPublicUrl } from '@/lib/storage';

// Utilidades de los tests de admin. Corren en Node, no en el navegador.

export const E2E_PREFIX = 'E2E ';

export const adminCreds = () => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  return email && password ? { email, password } : null;
};

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Lectura con la anon key: lo mismo que ve un visitante. */
export async function readProduct(name: string) {
  const anon = createClient(url(), anonKey(), { auth: { persistSession: false } });
  const { data, error } = await anon
    .from('products')
    .select('id, name, stock, product_images(id, image_url)')
    .eq('name', name)
    .maybeSingle();
  if (error) throw error;
  return data as
    | { id: string; name: string; stock: number; product_images: { id: string; image_url: string }[] }
    | null;
}

/**
 * Borra todo lo que hayan dejado los tests: productos cuyo nombre empieza por
 * E2E_PREFIX, sus filas de imágenes (en cascada) y sus ficheros del bucket.
 *
 * Usa la service_role de .env.local porque los ficheros solo se pueden borrar
 * con ella. Nunca toca un producto que no empiece por el prefijo.
 */
export async function cleanupE2EProducts() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY para limpiar tras los tests.');
  const admin = createClient(url(), serviceKey, { auth: { persistSession: false } });

  const { data: leftovers, error } = await admin
    .from('products')
    .select('id, name, product_images(image_url)')
    .like('name', `${E2E_PREFIX}%`);
  if (error) throw error;
  if (!leftovers?.length) return 0;

  const paths = leftovers
    .flatMap((p) => (p.product_images as { image_url: string }[]).map((i) => i.image_url))
    .map((u) => storagePathFromPublicUrl(u))
    .filter((p): p is string => !!p);

  // Las subidas se llaman `<productId>_<timestamp>.<ext>` en la raíz del
  // bucket: así también se recogen ficheros cuya fila ya se borró.
  for (const p of leftovers) {
    const { data: files } = await admin.storage.from(PRODUCTS_BUCKET).list('', { search: p.id });
    for (const f of files ?? []) if (f.name.startsWith(p.id)) paths.push(f.name);
  }
  if (paths.length) await admin.storage.from(PRODUCTS_BUCKET).remove(Array.from(new Set(paths)));

  const { error: delError } = await admin
    .from('products')
    .delete()
    .in('id', leftovers.map((p) => p.id));
  if (delError) throw delError;
  return leftovers.length;
}

/**
 * PNG válido de 8×8 px de un color, generado aquí para no guardar binarios en
 * el repo. Cada llamada con otro color da un fichero distinto.
 */
export function pngFile(name: string, rgb: [number, number, number] = [200, 30, 30]) {
  const size = 8;
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bits por canal
  header[9] = 2; // RGB
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array(size).fill(rgb).flat())]);
  const pixels = zlib.deflateSync(Buffer.concat(Array(size).fill(row)));
  const buffer = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', pixels),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  return { name, mimeType: 'image/png', buffer };
}
