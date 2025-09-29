'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, NewProduct, ProductContextType, StockStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useSupabase } from '@/context/SupabaseContext';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const initialProducts: Product[] = [
  {
    id: '1',
    name: 'Parche F-18 Super Hornet',
    category: 'parches',
    price: 12.99,
    stock: 25,
  image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    description: 'Parche bordado oficial del F-18 Super Hornet',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Camiseta Eurofighter Typhoon',
    category: 'camisetas',
    price: 24.99,
    stock: 15,
  image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    description: 'Camiseta negra con diseño del Eurofighter Typhoon',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Llavero F-18 Metálico',
    category: 'llaveros',
    price: 8.99,
    stock: 3,
  image_url: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop',
    description: 'Llavero metálico con forma de F-18',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Parche Escuadrón Ala 15',
    category: 'parches',
    price: 10.99,
    stock: 0,
  image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    description: 'Parche oficial del Escuadrón Ala 15',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
  }
];

const initialNewProduct: NewProduct = {
  name: '',
  category: 'parches',
  price: '',
  stock: '',
  image_url: '',
  description: ''
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>(initialNewProduct);
  const { isAuthenticated, user } = useAuth();
  const { 
    products, 
    isLoading, 
    error, 
    addProduct: addProductSupabase, 
    updateProduct: updateProductSupabase, 
    deleteProduct: deleteProductSupabase, 
    updateStock: updateStockSupabase 
  } = useSupabase();

  // Los productos ahora se cargan automáticamente desde Supabase

  const addProduct = async (productData: Omit<Product, 'id'>) => {
    const created = await addProductSupabase(productData);
    setNewProduct(initialNewProduct);
    setShowAddProduct(false);
    return created;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const productId = products.find(p => p.id === id)?.id;
    if (productId) {
      await updateProductSupabase(productId, updates);
    }
  };

  const deleteProduct = async (id: string) => {
    const productId = products.find(p => p.id === id)?.id;
    if (productId) {
      await deleteProductSupabase(productId);
    }
  };

  const updateStock = async (productId: string, newStock: number) => {
    const productIdStr = products.find(p => p.id === productId)?.id;
    if (productIdStr) {
      await updateStockSupabase(productIdStr, newStock);
    }
  };

  // Función para limpiar el estado cuando se cierra la sesión
  useEffect(() => {
    if (!isAuthenticated) {
      setShowAddProduct(false);
      setEditingProduct(null);
      setNewProduct(initialNewProduct);
    }
  }, [isAuthenticated]);

  const getStockStatus = (stock: number): StockStatus => {
    if (stock === 0) return { status: 'agotado', color: 'text-red-500', bgColor: 'bg-red-100' };
    if (stock <= 5) return { status: 'stock bajo', color: 'text-orange-500', bgColor: 'bg-orange-100' };
    return { status: 'disponible', color: 'text-green-500', bgColor: 'bg-green-100' };
  };

  const value: ProductContextType = {
    products,
    isAdmin: isAuthenticated && !!user,
    searchTerm,
    selectedCategory,
    showAddProduct,
    editingProduct,
    newProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    setSearchTerm,
    setSelectedCategory,
    setShowAddProduct,
    setEditingProduct,
    setNewProduct,
    toggleAdmin: () => {}, // Ya no se usa, se maneja con useAuth
    getStockStatus
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

