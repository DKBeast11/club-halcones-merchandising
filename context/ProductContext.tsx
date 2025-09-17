'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, NewProduct, ProductContextType, StockStatus } from '@/types';
import { useAuth } from '@/context/AuthContext';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Parche F-18 Super Hornet',
    category: 'parches',
    price: 12.99,
    stock: 25,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    description: 'Parche bordado oficial del F-18 Super Hornet',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    name: 'Camiseta Eurofighter Typhoon',
    category: 'camisetas',
    price: 24.99,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
    description: 'Camiseta negra con diseño del Eurofighter Typhoon',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    name: 'Llavero F-18 Metálico',
    category: 'llaveros',
    price: 8.99,
    stock: 3,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop',
    description: 'Llavero metálico con forma de F-18',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    name: 'Parche Escuadrón Ala 15',
    category: 'parches',
    price: 10.99,
    stock: 0,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
    description: 'Parche oficial del Escuadrón Ala 15',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const initialNewProduct: NewProduct = {
  name: '',
  category: 'parches',
  price: '',
  stock: '',
  image: '',
  description: ''
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>(initialNewProduct);
  const { isAuthenticated } = useAuth();

  // Cargar productos desde localStorage al inicializar
  useEffect(() => {
    const savedProducts = localStorage.getItem('club-halcones-products');
    if (savedProducts) {
      try {
        const parsedProducts = JSON.parse(savedProducts);
        setProducts(parsedProducts.map((p: any) => ({
          ...p,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date()
        })));
      } catch (error) {
        console.error('Error loading products from localStorage:', error);
        setProducts(initialProducts);
      }
    } else {
      setProducts(initialProducts);
    }
  }, []);

  // Guardar productos en localStorage cuando cambien
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('club-halcones-products', JSON.stringify(products));
    }
  }, [products]);

  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setProducts(prev => [...prev, newProduct]);
    setNewProduct(initialNewProduct);
    setShowAddProduct(false);
  };

  const updateProduct = (id: number, updates: Partial<Product>) => {
    setProducts(prev => prev.map(product => 
      product.id === id 
        ? { ...product, ...updates, updatedAt: new Date() }
        : product
    ));
  };

  const deleteProduct = (id: number) => {
    setProducts(prev => prev.filter(product => product.id !== id));
  };

  const updateStock = (productId: number, newStock: number) => {
    setProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, stock: Math.max(0, newStock), updatedAt: new Date() }
        : product
    ));
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
    isAdmin: isAuthenticated,
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

