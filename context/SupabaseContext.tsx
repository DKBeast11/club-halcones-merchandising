'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { adminFetch } from '@/lib/adminFetch';
import { Category, Product } from '@/types';

interface SupabaseContextType {
  products: Product[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id'>) => Promise<Product>;
  addCategory: (name: string) => Promise<Category>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  updateStock: (productId: string, newStock: number) => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar las categorías. La tabla tiene SELECT público, así que vale el
  // cliente anónimo: la barra de filtros la ve todo el mundo, no solo el admin.
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, position')
      .order('position', { ascending: true });

    if (error) {
      // Que falle la lista de categorías no puede tumbar el catálogo: sin ella
      // la rejilla se sigue viendo entera, solo se queda sin filtros.
      console.error('Error loading categories:', error);
      return;
    }

    setCategories((data as Category[]) ?? []);
  };

  // Cargar productos desde Supabase
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('products')
        // Traer también las imágenes relacionadas de product_images
        .select('*, product_images(id, image_url, position, created_at)')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Convertir los datos de Supabase al formato de Product
      const formattedProducts: Product[] = data?.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        // price puede venir como string o número
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        stock: item.stock,
        image_url: item.image_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
        // Mapear las imágenes relacionadas si existen
        images: item.product_images ? item.product_images.map((img: any) => ({
          id: img.id,
          product_id: item.id,
          image_url: img.image_url,
          position: img.position,
          created_at: img.created_at
        })) : undefined,
        description: item.description || '',
        created_at: item.created_at,
        updated_at: item.updated_at
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
  const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    setError(null);
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        category: productData.category,
        price: productData.price,
        stock: productData.stock,
        image_url: productData.image_url,
        description: productData.description
      }])
      .select()
      .single();

    if (error) {
      setError(error.message);
      throw new Error(error.message);
    }

    // Recargar productos
    await loadProducts();

    return data as Product;
  };

  // Dar de alta una categoría. Va por /api/admin/categories y no directo a la
  // tabla porque RLS solo permite leer: escribir exige service_role, que vive
  // en el servidor y solo se usa tras comprobar la sesión de admin.
  const addCategory = async (name: string): Promise<Category> => {
    setError(null);

    const res = await adminFetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      const message = body?.error ?? 'No se ha podido crear la categoría.';
      setError(message);
      throw new Error(message);
    }

    const created = body as Category;
    setCategories((prev) =>
      [...prev, created].sort((a, b) => a.position - b.position)
    );

    return created;
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
  if (updates.image_url) updateData.image_url = updates.image_url;
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

  // Cargar productos y categorías al montar el componente
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const value: SupabaseContextType = {
    products,
    categories,
    isLoading,
    error,
    addProduct,
    addCategory,
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
