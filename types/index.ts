export interface Product {
  id: string; // UUID en la base de datos
  name: string;
  // Identificador de una fila de `categories`, no una lista cerrada: las
  // categorías se dan de alta desde el panel y las valida la clave ajena
  // products_category_fkey, no el tipo.
  category: string;
  price: number;
  stock: number;
  image_url?: string;
  images?: ProductImage[];
  description?: string;
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

/** Una fila de `categories`. */
export interface Category {
  /** Identificador en minúsculas y sin acentos: el que guarda products.category. */
  id: string;
  /** Nombre presentable, con acentos y mayúsculas. */
  name: string;
  /** Orden en la barra de filtros. Menor primero. */
  position: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  position?: number;
  created_at?: string;
}
