import { test, expect, type Page } from '@playwright/test';

// Lo que ve cualquiera que entra en la tienda. Solo lectura: se puede lanzar
// contra el Supabase real sin tocar nada.

/** Ruido del entorno local: Analytics y Speed Insights solo existen en Vercel. */
const LOCAL_NOISE = /_vercel\/|Vercel (Web Analytics|Speed Insights)|status of 404/;

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !LOCAL_NOISE.test(msg.text())) errors.push(msg.text());
  });
  return errors;
}

const cards = (page: Page) => page.getByRole('article');

test('el HTML llega ya con los productos, sin esperar a JavaScript', async ({ request }) => {
  // Es el objetivo de la fase 2: antes la página se servía vacía y los
  // productos los pedía un useEffect tras hidratar.
  const res = await request.get('/');
  expect(res.ok()).toBeTruthy();
  const html = await res.text();
  expect((html.match(/<article/g) ?? []).length).toBeGreaterThan(0);
  expect(html).not.toContain('Cargando catálogo');
});

test('la página carga sin errores en consola', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(cards(page).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('el filtro por categoría reduce la rejilla y "Todo" la restaura', async ({ page }) => {
  await page.goto('/');
  const filters = page.getByRole('group', { name: 'Filtrar por categoría' });
  const total = await cards(page).count();
  expect(total).toBeGreaterThan(0);

  // Cada categoría muestra un subconjunto, y entre todas suman el total:
  // ningún producto queda fuera de su filtro (el fallo que había cuando la
  // lista de categorías estaba escrita a mano).
  const buttons = filters.getByRole('button');
  // textContent y no innerText: el CSS pone los rótulos en mayúsculas.
  const names = (await buttons.allTextContents()).filter((n) => !/^todo$/i.test(n.trim()));
  let sum = 0;
  for (const name of names) {
    await filters.getByRole('button', { name, exact: true }).click();
    await expect(filters.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true');
    const n = await cards(page).count();
    expect(n).toBeLessThanOrEqual(total);
    sum += n;
  }
  expect(sum).toBe(total);

  await filters.getByRole('button', { name: /^todo$/i }).click();
  await expect(cards(page)).toHaveCount(total);
});

test('la búsqueda filtra por nombre y avisa cuando no hay nada', async ({ page }) => {
  await page.goto('/');
  const first = cards(page).first();
  const name = (await first.getAttribute('aria-label'))!;
  const search = page.getByRole('searchbox', { name: 'Buscar productos' });

  await search.fill(name.slice(0, 12));
  await expect(page.getByRole('article', { name })).toBeVisible();

  await search.fill('zzz-no-existe-zzz');
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByText(/sin resultados/i)).toBeVisible();
});

test('cada tarjeta enseña precio y testigo de stock', async ({ page }) => {
  await page.goto('/');
  const card = cards(page).first();
  await expect(card.getByText(/\d+\.\d{2} €/)).toBeVisible();
  await expect(card.getByText(/^(disponible|últimas|agotado)$/i)).toBeVisible();
});

test('el acceso de admin abre, rechaza una contraseña mala y se cierra con Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /acceso admin/i }).click();
  const dialog = page.getByRole('dialog', { name: /acceso admin/i });
  await expect(dialog).toBeVisible();

  await dialog.locator('#admin-email').fill('nadie@club-halcones.test');
  await dialog.locator('#admin-password').fill('no-es-la-contraseña');
  await dialog.getByRole('button', { name: /entrar/i }).click();
  await expect(dialog.getByRole('alert')).toContainText(/incorrectos/i);
  // Sigue en modo visitante.
  await expect(page.getByRole('region', { name: 'Panel de administración' })).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('/api/keepalive confirma que la base de datos responde', async ({ request }) => {
  const res = await request.get('/api/keepalive');
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test('las rutas de admin rechazan peticiones sin sesión', async ({ request }) => {
  const calls = [
    request.get('/api/admin/images?productId=x'),
    request.post('/api/admin/images', { multipart: { productId: 'x', imageUrl: 'https://x/y.png' } }),
    request.delete('/api/admin/images/00000000-0000-0000-0000-000000000000'),
    request.delete('/api/admin/products/00000000-0000-0000-0000-000000000000'),
    request.post('/api/admin/categories', { data: { name: 'Intrusa' } }),
    request.post('/api/admin/categories', {
      data: { name: 'Intrusa' },
      headers: { Authorization: 'Bearer token-inventado' },
    }),
  ];
  for (const res of await Promise.all(calls)) expect(res.status()).toBe(401);
});
