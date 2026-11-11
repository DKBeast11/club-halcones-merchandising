import { test, expect } from '@playwright/test';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchCatalog, fetchCategories, fetchProducts, PLACEHOLDER_IMAGE } from '@/lib/catalog';

/**
 * Cliente falso: devuelve la respuesta indicada para cada tabla, sea cual sea
 * la cadena de .select().order() que se le pida.
 */
function fakeClient(responses: Record<string, { data: unknown; error: { message: string } | null }>) {
  return {
    from(table: string) {
      const result = responses[table];
      const chain = {
        select: () => chain,
        order: () => Promise.resolve(result),
      };
      return chain;
    },
  } as unknown as SupabaseClient;
}

const row = {
  id: 'p1',
  name: 'Parche',
  category: 'parches',
  price: '12.50',
  stock: 3,
  description: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  product_images: [{ id: 'i1', image_url: 'https://x/img.png', position: 1, created_at: 'x' }],
};

test('el precio NUMERIC llega como string y se convierte en número', async () => {
  const [p] = await fetchProducts(fakeClient({ products: { data: [row], error: null } }));
  expect(p.price).toBe(12.5);
});

test('las imágenes se asocian a su producto y faltando la principal se usa la de relleno', async () => {
  const [p] = await fetchProducts(fakeClient({ products: { data: [row], error: null } }));
  expect(p.images).toEqual([{ ...row.product_images[0], product_id: 'p1' }]);
  // products no tiene columna image_url: siempre sale la de relleno y la
  // tarjeta tira de `images`.
  expect(p.image_url).toBe(PLACEHOLDER_IMAGE);
  expect(p.description).toBe('');
});

test('si fallan los productos, la lectura lanza', async () => {
  const client = fakeClient({ products: { data: null, error: { message: 'boom' } } });
  await expect(fetchProducts(client)).rejects.toThrow(/boom/);
});

test('si fallan las categorías, el catálogo sigue con la lista vacía', async () => {
  const client = fakeClient({
    products: { data: [row], error: null },
    categories: { data: null, error: { message: 'sin permiso' } },
  });
  expect(await fetchCategories(client)).toEqual([]);
  const catalog = await fetchCatalog(client);
  expect(catalog.products).toHaveLength(1);
  expect(catalog.categories).toEqual([]);
});

test.describe('storagePathFromPublicUrl', () => {
  test('saca la ruta dentro del bucket, decodificada', async () => {
    const { storagePathFromPublicUrl } = await import('@/lib/storage');
    expect(
      storagePathFromPublicUrl(
        'https://x.supabase.co/storage/v1/object/public/Products/PARCHES/Hornet%20Azul.png'
      )
    ).toBe('PARCHES/Hornet Azul.png');
  });

  test('una URL de otro bucket, firmada o externa no es borrable', async () => {
    const { storagePathFromPublicUrl } = await import('@/lib/storage');
    expect(storagePathFromPublicUrl('https://x.supabase.co/storage/v1/object/public/otro/a.png')).toBeNull();
    expect(storagePathFromPublicUrl('https://x.supabase.co/storage/v1/object/sign/Products/a.png?token=t')).toBeNull();
    expect(storagePathFromPublicUrl('https://images.unsplash.com/photo.png')).toBeNull();
    expect(storagePathFromPublicUrl('no es una url')).toBeNull();
  });
});
