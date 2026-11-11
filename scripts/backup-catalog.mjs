// Copia de seguridad del catálogo: tablas e imágenes.
//
// El plan gratuito de Supabase no hace backups ("LAST BACKUP: No backups"),
// así que esta es la única copia que hay fuera de su infraestructura.
//
//   node scripts/backup-catalog.mjs
//
// Deja en backups/AAAA-MM-DD/:
//   catalog.json  categorías, productos y filas de product_images
//   images/       los ficheros de las imágenes, con su ruta dentro del bucket
//
// Solo usa la anon key: todo lo que copia es de lectura pública. Lee las
// variables de .env.local, el mismo fichero que usa `npm run dev`.
//
// No se llama a process.exit(): en Windows, salir con peticiones todavía
// abiertas revienta con una aserción de libuv. Se fija process.exitCode y se
// deja que el proceso termine solo.

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PUBLIC_MARKER = '/storage/v1/object/public/';

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

async function table(url, key, name, order) {
  const res = await fetch(`${url}/rest/v1/${name}?select=*&order=${order}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    // Un proyecto pausado o arrancando responde con una página HTML de
    // Cloudflare; de ella solo interesa el código.
    const body = (await res.text()).slice(0, 200);
    const lines = [`${name}: HTTP ${res.status}${body.startsWith('<') ? '' : ` ${body}`}`];
    if (res.status >= 520) {
      lines.push('¿Está el proyecto pausado o restaurándose? Mira el panel de Supabase.');
    }
    throw new Error(lines.join('\n'));
  }
  return res.json();
}

async function main() {
  const env = { ...loadEnv('.env.local'), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local');
  }

  const [categories, products, productImages] = await Promise.all([
    table(url, key, 'categories', 'position'),
    table(url, key, 'products', 'id'),
    table(url, key, 'product_images', 'id'),
  ]);

  const out = join('backups', new Date().toISOString().slice(0, 10));
  mkdirSync(out, { recursive: true });
  writeFileSync(
    join(out, 'catalog.json'),
    JSON.stringify({ takenAt: new Date().toISOString(), categories, products, productImages }, null, 2) + '\n',
  );

  // Las imágenes viven en el bucket público `Products`. Se guardan con la
  // ruta que tienen dentro del bucket, que es lo que haría falta para
  // volver a subirlas.
  const urls = new Set(
    [...productImages.map((r) => r.image_url), ...products.map((p) => p.image_url)].filter(Boolean),
  );

  let ok = 0;
  const failed = [];
  for (const src of urls) {
    const i = src.indexOf(PUBLIC_MARKER);
    if (i === -1) {
      failed.push(`${src} (no es una URL pública del bucket)`);
      continue;
    }
    const objectPath = decodeURIComponent(src.slice(i + PUBLIC_MARKER.length).split('?')[0]);
    const res = await fetch(src);
    if (!res.ok) {
      failed.push(`${objectPath} (HTTP ${res.status})`);
      continue;
    }
    const dest = join(out, 'images', objectPath);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    ok++;
  }

  console.log(`${categories.length} categorías, ${products.length} productos, ${productImages.length} filas de imágenes`);
  console.log(`${ok}/${urls.size} imágenes descargadas en ${out}`);
  if (failed.length) {
    console.error('No se pudieron copiar:\n  ' + failed.join('\n  '));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
