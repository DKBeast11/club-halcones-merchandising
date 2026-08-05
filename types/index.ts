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

export interface StockStatus {
  status: 'disponible' | 'stock bajo' | 'agotado';
  color: string;
  bgColor: string;
}

export interface NewProduct {
  name: string;
  category: string;
  price: string;
  stock: string;
  image_url?: string;
  description?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  position?: number;
  created_at?: string;
}

export interface ProductContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  searchTerm: string;
  selectedCategory: string;
  showAddProduct: boolean;
  editingProduct: Product | null;
  newProduct: NewProduct;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  addCategory: (name: string) => Promise<Category>;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  updateStock: (productId: string, newStock: number) => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setShowAddProduct: (show: boolean) => void;
  setEditingProduct: (product: Product | null) => void;
  setNewProduct: (product: NewProduct) => void;
  toggleAdmin: () => void;
  getStockStatus: (stock: number) => StockStatus;
}

