'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

interface SupabaseContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, newStock: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar productos desde Supabase
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convertir los datos de Supabase al formato de Product
      const formattedProducts: Product[] = data?.map(item => ({
        id: parseInt(item.id.replace(/-/g, '').substring(0, 8), 16), // Convertir UUID a número
        name: item.name,
        category: item.category,
        price: parseFloat(item.price),
        stock: item.stock,
        image: item.image_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
        description: item.description || '',
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      })) || [];

      setProducts(formattedProducts);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Añadir producto
  const addProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        .insert([{
          name: productData.name,
          category: productData.category,
          price: productData.price,
          stock: productData.stock,
          image_url: productData.image,
          description: productData.description
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Recargar productos
      await loadProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Error al añadir producto');
    }
  };

  // Actualizar producto
  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setError(null);
      
      const updateData: any = {};
      if (updates.name) updateData.name = updates.name;
      if (updates.category) updateData.category = updates.category;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.image) updateData.image_url = updates.image;
      if (updates.description) updateData.description = updates.description;

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Recargar productos
      await loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar producto');
    }
  };

  // Eliminar producto
  const deleteProduct = async (id: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Recargar productos
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar producto');
    }
  };

  // Actualizar stock
  const updateStock = async (productId: string, newStock: number) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('products')
        .update({ stock: Math.max(0, newStock) })
        .eq('id', productId);

      if (error) {
        throw error;
      }

      // Recargar productos
      await loadProducts();
    } catch (err) {
      console.error('Error updating stock:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar stock');
    }
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    loadProducts();
  }, []);

  const value: SupabaseContextType = {
    products,
    isLoading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    refreshProducts: loadProducts
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};
