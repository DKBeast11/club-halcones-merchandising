import { test, expect, type Page, type Locator } from '@playwright/test';
import { adminCreds, cleanupE2EProducts, E2E_PREFIX, pngFile, readProduct } from './support';

// El panel de admin de principio a fin, con la cuenta de tests
// (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD en .env.local).
//
// Escribe en el Supabase de verdad, pero solo sobre productos que crea él,
// con el nombre empezando por "E2E ". Se limpian antes y después, también si
// un paso falla a medias.
//
// Los pasos comparten página y producto, así que van en serie y en orden.

const creds = adminCreds();
test.skip(!creds, 'Faltan E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD en .env.local');

test.describe.configure({ mode: 'serial' });

const RUN = Date.now().toString(36);
const NO_PRODUCT = '00000000-0000-0000-0000-000000000000';
const PRODUCT = `${E2E_PREFIX}Parche de prueba ${RUN}`;
const PRODUCT_BY_URL = `${E2E_PREFIX}Con imagen por URL ${RUN}`;

let page: Page;
const card = (name = PRODUCT): Locator => page.getByRole('article', { name, exact: true });
const panel = () => page.getByRole('region', { name: 'Panel de administración' });

/** URL real de la imagen que enseña la tarjeta, sin el envoltorio de next/image. */
async function cardImageSrc(name = PRODUCT) {
  const src = (await card(name).getByRole('img').first().getAttribute('src'))!;
  const wrapped = new URL(src, 'http://x').searchParams.get('url');
  return wrapped ?? src;
}

async function createProduct(name: string, opts: { file?: boolean; imageUrl?: string }) {
  const p = panel();
  await p.getByRole('button', { name: 'Añadir producto' }).click();
  await p.locator('#p-name').fill(name);
  await p.locator('#p-price').fill('4.50');
  await p.locator('#p-stock').fill('7');
  await p.locator('#p-desc').fill('Creado por los tests automáticos. Se borra solo.');
  if (opts.file) await p.locator('#p-file').setInputFiles(pngFile(`e2e-${RUN}.png`));
  if (opts.imageUrl) await p.locator('#p-url').fill(opts.imageUrl);
  await p.locator('form').getByRole('button', { name: 'Añadir producto' }).click();
}

test.beforeAll(async ({ browser }) => {
  await cleanupE2EProducts();
  page = await browser.newPage();
});

test.afterAll(async () => {
  await page?.close();
  await cleanupE2EProducts();
});

test('entra como admin', async () => {
  await page.goto('/');
  await page.getByRole('button', { name: /acceso admin/i }).click();
  const dialog = page.getByRole('dialog', { name: /acceso admin/i });
  await dialog.locator('#admin-email').fill(creds!.email);
  await dialog.locator('#admin-password').fill(creds!.password);
  await dialog.getByRole('button', { name: /entrar/i }).click();

  await expect(dialog).toBeHidden();
  await expect(panel()).toBeVisible();
  await expect(page.getByRole('banner').getByRole('button', { name: /cerrar sesión/i })).toBeVisible();
});

test('crea un producto con imagen subida y la tarjeta sale ya con su foto', async () => {
  await createProduct(PRODUCT, { file: true });

  await expect(card()).toBeVisible();
  // Antes se refrescaba antes de registrar la imagen y la tarjeta nueva salía
  // con la de relleno hasta recargar.
  await expect.poll(() => cardImageSrc()).toMatch(/supabase\.co\/storage\/v1\/object\/public\/Products\//);
  await expect(card().getByText('7 ud.')).toBeVisible();

  const row = await readProduct(PRODUCT);
  expect(row?.stock).toBe(7);
  expect(row?.product_images).toHaveLength(1);
});

test('crea un producto indicando la imagen por URL', async () => {
  // Fallaba siempre: el alta mandaba image_url, una columna que `products`
  // no tiene, y PostgREST rechazaba la fila entera.
  const existing = await cardImageSrc();
  await createProduct(PRODUCT_BY_URL, { imageUrl: existing });

  await expect(panel().getByRole('alert')).toHaveCount(0);
  await expect(card(PRODUCT_BY_URL)).toBeVisible();
  await expect.poll(() => cardImageSrc(PRODUCT_BY_URL)).toBe(existing);
});

test('sumar y restar stock se guarda en la base de datos', async () => {
  await card().getByRole('button', { name: 'Sumar 1 unidad de stock' }).click();
  await expect(card().getByText('8 ud.')).toBeVisible();
  await expect.poll(async () => (await readProduct(PRODUCT))?.stock).toBe(8);

  // Dos clics seguidos, sin esperar a la red: antes ambos salían del mismo
  // valor y se perdía uno (de 8 quedaba 7).
  const minus = card().getByRole('button', { name: 'Restar 1 unidad de stock' });
  await minus.click();
  await minus.click();
  await expect(card().getByText('6 ud.')).toBeVisible();

  // Y una ráfaga más larga mezclando pasos.
  const plus10 = card().getByRole('button', { name: 'Sumar 10 unidades de stock' });
  const plus1 = card().getByRole('button', { name: 'Sumar 1 unidad de stock' });
  await plus10.click();
  await plus1.click();
  await plus1.click();
  await card().getByRole('button', { name: 'Restar 10 unidades de stock' }).click();
  await minus.click();
  await minus.click();
  await expect(card().getByText('6 ud.')).toBeVisible();
  await expect.poll(async () => (await readProduct(PRODUCT))?.stock).toBe(6);
  await plus10.click();
  await expect.poll(async () => (await readProduct(PRODUCT))?.stock).toBe(16);
  await card().getByRole('button', { name: 'Restar 10 unidades de stock' }).click();
  await expect(card().getByText('6 ud.')).toBeVisible();
  await expect.poll(async () => (await readProduct(PRODUCT))?.stock).toBe(6);
});

test('si el cambio de stock no se guarda, avisa y la rejilla sigue a la vista', async () => {
  // Simula lo que hace RLS con la sesión caducada: responde 200 sin tocar
  // ninguna fila. Antes el cambio se perdía en silencio.
  await page.route('**/rest/v1/products?*', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      : route.fallback()
  );
  await card().getByRole('button', { name: 'Sumar 1 unidad de stock' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /no se ha guardado/i })).toBeVisible();
  await expect(card().getByText('6 ud.')).toBeVisible();

  // Y un error del servidor tampoco tapa el catálogo (antes lo sustituía por
  // "No se ha podido cargar el catálogo").
  await page.unrouteAll();
  await page.route('**/rest/v1/products?*', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"fallo simulado"}' })
      : route.fallback()
  );
  await card().getByRole('button', { name: 'Sumar 1 unidad de stock' }).click();
  await expect(page.getByRole('alert').filter({ hasText: /fallo simulado/i })).toBeVisible();
  await expect(page.getByRole('article').first()).toBeVisible();

  await page.unrouteAll();
  await page.getByRole('button', { name: 'Cerrar aviso' }).click();
  // Solo dentro de main: Next mete un role=alert vacío (su anunciador de rutas).
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
  expect((await readProduct(PRODUCT))?.stock).toBe(6);
});

test('el gestor de imágenes sube y borra, y la tarjeta se entera sin recargar', async () => {
  await card().getByRole('button', { name: 'Imágenes' }).click();
  const dialog = page.getByRole('dialog', { name: /gestionar imágenes/i });
  await expect(dialog.getByRole('img', { name: 'Imagen 1' })).toBeVisible();

  await dialog.locator('#image-upload').setInputFiles(pngFile(`e2e-${RUN}-b.png`, [30, 120, 200]));
  await dialog.getByRole('button', { name: /^Subir 1$/ }).click();
  await expect(dialog.getByRole('img', { name: 'Imagen 2' })).toBeVisible();
  await expect(dialog.getByText('2 / 5')).toBeVisible();

  // La tarjeta pasa a tener carrusel sin recargar la página.
  await expect(card().getByRole('button', { name: 'Imagen siguiente' })).toBeAttached();

  const before = await readProduct(PRODUCT);
  expect(before?.product_images).toHaveLength(2);

  await dialog.getByRole('button', { name: 'Eliminar imagen 2' }).click();
  await expect(dialog.getByText('1 / 5')).toBeVisible();
  await expect(card().getByRole('button', { name: 'Imagen siguiente' })).toHaveCount(0);

  // La fila desaparece y el fichero del bucket también (antes se quedaba).
  const after = await readProduct(PRODUCT);
  expect(after?.product_images).toHaveLength(1);
  const gone = before!.product_images.find((i) => i.id !== after!.product_images[0].id)!;
  await expect
    .poll(async () => (await fetch(gone.image_url, { method: 'HEAD' })).status)
    .not.toBe(200);

  await dialog.getByRole('button', { name: /cerrar/i }).first().click();
  await expect(dialog).toBeHidden();
});

test('borrar un producto se lleva sus ficheros, pero no los que usa otro', async () => {
  const shared = (await readProduct(PRODUCT))!.product_images.map((i) => i.image_url);
  expect(shared).toHaveLength(1);
  const del = async (name: string) => {
    await card(name).getByRole('button', { name: `Eliminar ${name}` }).click();
    await card(name).getByRole('button', { name: 'Confirmar' }).click();
    await expect(card(name)).toHaveCount(0);
    await expect.poll(() => readProduct(name)).toBeNull();
  };
  const status = async () => (await fetch(shared[0], { method: 'HEAD' })).status;

  // El producto "por URL" apunta al fichero del otro: al borrarlo, el
  // fichero tiene que seguir ahí porque el otro aún lo usa.
  await del(PRODUCT_BY_URL);
  expect(await status()).toBe(200);

  // Al borrar el último que lo usa, el fichero se va. Antes las filas se iban
  // en cascada pero el fichero se quedaba huérfano en el bucket.
  await del(PRODUCT);
  await expect.poll(status).not.toBe(200);
});

test('cerrar sesión invalida de verdad la sesión de Supabase', async () => {
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => /^sb-.*-auth-token$/.test(k));
    return key ? JSON.parse(localStorage.getItem(key)!).access_token : null;
  });
  expect(token).toBeTruthy();
  const withToken = () =>
    page.request.get(`/api/admin/images?productId=${NO_PRODUCT}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  expect((await withToken()).status()).toBe(200);
  // Un id mal formado es un 400, no un 500.
  const bad = await page.request.get('/api/admin/images?productId=x', {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(bad.status()).toBe(400);

  await page.getByRole('banner').getByRole('button', { name: /cerrar sesión/i }).click();
  await expect(panel()).toHaveCount(0);
  await expect(page.getByRole('button', { name: /acceso admin/i })).toBeVisible();

  // Antes solo cambiaba la interfaz: el token seguía en el navegador y seguía
  // valiendo para /api/admin.
  const stored = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('sb-')));
  expect(stored).toEqual([]);
  expect((await withToken()).status()).toBe(401);
});
