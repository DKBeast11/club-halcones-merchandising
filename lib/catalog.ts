import type { SupabaseClient } from '@supabase/supabase-js';
import type { Category, Product, ProductImage } from '@/types';

// Lectura del catálogo. La usan igual el servidor, para pintar la página ya
// con los productos, y el cliente, para refrescar tras un cambio del admin.
// Por eso recibe el cliente en vez de importarlo.

export interface Catalog {
  products: Product[];
  categories: Category[];
}

/** "Todo" no es una categoría de la tabla: es el filtro vacío. */
export const ALL_CATEGORIES = 'all';

/** Imagen que se muestra cuando un producto no tiene ninguna. */
export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop';

interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number | string;
  stock: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  product_images: Omit<ProductImage, 'product_id'>[] | null;
}

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    // NUMERIC llega como string desde PostgREST.
    price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
    stock: row.stock,
    // `products` no tiene columna image_url (comprobado contra la base de
    // datos el 11-11-2026): las imágenes viven en product_images. Este campo
    // es solo el relleno que enseña el carrusel cuando no hay ninguna.
    image_url: PLACEHOLDER_IMAGE,
    images: row.product_images?.map((img) => ({ ...img, product_id: row.id })),
    description: row.description || '',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function fetchProducts(client: SupabaseClient): Promise<Product[]> {
  const { data, error } = await client
    .from('products')
    .select('*, product_images(id, image_url, position, created_at)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`No se han podido leer los productos: ${error.message}`);
  return (data as ProductRow[]).map(toProduct);
}

/**
 * Que falle la lista de categorías no puede tumbar el catálogo: sin ella la
 * rejilla se sigue viendo entera, solo se queda sin filtros.
 */
export async function fetchCategories(client: SupabaseClient): Promise<Category[]> {
  const { data, error } = await client
    .from('categories')
    .select('id, name, position')
    .order('position', { ascending: true });

  if (error) {
    console.error('No se han podido leer las categorías:', error.message);
    return [];
  }
  return data as Category[];
}

export async function fetchCatalog(client: SupabaseClient): Promise<Catalog> {
  const [products, categories] = await Promise.all([
    fetchProducts(client),
    fetchCategories(client),
  ]);
  return { products, categories };
}
