export interface Product {
  id: string; // UUID en la base de datos
  name: string;
  category: 'parches' | 'camisetas' | 'llaveros';
  price: number;
  stock: number;
  image_url?: string;
  description?: string;
  created_at?: string; // ISO string
  updated_at?: string; // ISO string
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface StockStatus {
  status: 'disponible' | 'stock bajo' | 'agotado';
  color: string;
  bgColor: string;
}

export interface NewProduct {
  name: string;
  category: 'parches' | 'camisetas' | 'llaveros';
  price: string;
  stock: string;
  image_url?: string;
  description?: string;
}

export interface ProductContextType {
  products: Product[];
  isAdmin: boolean;
  searchTerm: string;
  selectedCategory: string;
  showAddProduct: boolean;
  editingProduct: Product | null;
  newProduct: NewProduct;
  addProduct: (product: Omit<Product, 'id'>) => void;
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

