'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { adminFetch } from '@/lib/adminFetch';
import { fetchCatalog, type Catalog } from '@/lib/catalog';
import type { Category, Product } from '@/types';

// Datos del catálogo y las operaciones del admin sobre ellos.
//
// Sustituye a la pareja ProductContext + SupabaseContext: el primero
// envolvía al segundo sin aportar nada y mezclaba datos con estado de la
// interfaz. La búsqueda y el filtro viven ahora en MerchandiseCatalog, que es
// quien los usa.
//
// Los datos llegan ya cargados desde el servidor (app/page.tsx), así que no
// hay estado de "cargando": la página sale pintada con los productos.

type NewProductInput = Omit<Product, 'id' | 'images' | 'created_at' | 'updated_at'>;

interface CatalogContextType extends Catalog {
  /**
   * Último fallo de una operación del admin. Se muestra como aviso encima de
   * la rejilla, sin ocultarla: antes un error al cambiar el stock sustituía
   * el catálogo entero por "No se ha podido cargar".
   */
  actionError: string | null;
  dismissActionError: () => void;
  /** Vuelve a leer productos y categorías. */
  refresh: () => Promise<void>;
  /** Crea el producto. No refresca: quien llama sube antes la imagen. */
  addProduct: (product: NewProductInput) => Promise<Product>;
  addCategory: (name: string) => Promise<Category>;
  /** Suma (o resta, con delta negativo) unidades al stock. Nunca baja de 0. */
  adjustStock: (productId: string, delta: number) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

/**
 * RLS no da error cuando bloquea un UPDATE o DELETE: simplemente no toca
 * ninguna fila. Sin esta comprobación, con la sesión caducada el botón
 * parecería funcionar y el cambio se perdería en silencio.
 */
const NO_ROWS = 'No se ha guardado el cambio. ¿Ha caducado la sesión? Vuelve a entrar como admin.';

export function CatalogProvider({ initial, children }: { initial: Catalog; children: ReactNode }) {
  const [products, setProducts] = useState(initial.products);
  const [categories, setCategories] = useState(initial.categories);
  const [actionError, setActionError] = useState<string | null>(null);

  const fail = useCallback((err: unknown, fallback: string) => {
    const message = err instanceof Error ? err.message : fallback;
    console.error(message);
    setActionError(message);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const catalog = await fetchCatalog(supabase);
      setProducts(catalog.products);
      setCategories(catalog.categories);
    } catch (err) {
      fail(err, 'No se ha podido recargar el catálogo.');
    }
  }, [fail]);

  const addProduct = useCallback(async (input: NewProductInput) => {
    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          name: input.name,
          category: input.category,
          price: input.price,
          stock: input.stock,
          // Sin image_url: la columna no existe en `products` y PostgREST
          // rechazaba el alta entera si el formulario traía una URL. La
          // imagen se registra después en product_images.
          description: input.description,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  }, []);

  // Va por /api/admin/categories y no directo a la tabla porque RLS solo deja
  // leerla: escribir exige service_role, que vive en el servidor.
  const addCategory = useCallback(async (name: string) => {
    const res = await adminFetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? 'No se ha podido crear la categoría.');

    const created = body as Category;
    setCategories((prev) => [...prev, created].sort((a, b) => a.position - b.position));
    return created;
  }, []);

  // Ajuste relativo del stock (+1, -10…), con la cifra a la vista al momento.
  //
  // Antes cada pulsación mandaba un valor absoluto calculado con el stock que
  // pintaba la tarjeta. Dos clics seguidos salían del mismo valor y se perdía
  // uno: de 8, "-1" dos veces dejaba 7. Ahora:
  //  - cada clic suma sobre el último objetivo pedido, no sobre lo pintado;
  //  - las escrituras de un producto van en cola, en orden, y si se acumulan
  //    varias solo se manda la última (el valor final es el mismo);
  //  - si una falla, la cifra vuelve al último valor que confirmó la base de
  //    datos y sale el aviso.
  const productsRef = useRef(products);
  productsRef.current = products;
  const stockTarget = useRef(new Map<string, number>());
  const stockConfirmed = useRef(new Map<string, number>());
  const stockQueue = useRef(new Map<string, Promise<void>>());

  const setStock = (productId: string, stock: number) =>
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock } : p)));

  const adjustStock = useCallback(
    (productId: string, delta: number) => {
      const shown = productsRef.current.find((p) => p.id === productId)?.stock ?? 0;
      if (!stockConfirmed.current.has(productId)) stockConfirmed.current.set(productId, shown);

      const target = Math.max(0, (stockTarget.current.get(productId) ?? shown) + delta);
      stockTarget.current.set(productId, target);
      setStock(productId, target);

      const write = async () => {
        // Ya hay un objetivo más nuevo en la cola: lo mandará su propia tarea.
        if (stockTarget.current.get(productId) !== target) return;
        try {
          const { data, error } = await supabase
            .from('products')
            .update({ stock: target })
            .eq('id', productId)
            .select('id');
          if (error) throw new Error(error.message);
          if (!data?.length) throw new Error(NO_ROWS);
          stockConfirmed.current.set(productId, target);
        } catch (err) {
          const confirmed = stockConfirmed.current.get(productId)!;
          stockTarget.current.delete(productId);
          setStock(productId, confirmed);
          fail(err, 'No se ha podido actualizar el stock.');
        }
      };

      const queued = (stockQueue.current.get(productId) ?? Promise.resolve()).then(write);
      stockQueue.current.set(productId, queued);
      return queued;
    },
    [fail]
  );

  const deleteProduct = useCallback(
    async (productId: string) => {
      try {
        // Por la API y no directo a la tabla: así se borran también los
        // ficheros de sus imágenes, que con la sesión del admin no se puede.
        const res = await adminFetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(
            res.status === 401 ? NO_ROWS : (body?.error ?? 'No se ha podido eliminar el producto.')
          );
        }
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } catch (err) {
        fail(err, 'No se ha podido eliminar el producto.');
      }
    },
    [fail]
  );

  const value = useMemo<CatalogContextType>(
    () => ({
      products,
      categories,
      actionError,
      dismissActionError: () => setActionError(null),
      refresh,
      addProduct,
      addCategory,
      adjustStock,
      deleteProduct,
    }),
    [products, categories, actionError, refresh, addProduct, addCategory, adjustStock, deleteProduct]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error('useCatalog tiene que usarse dentro de un CatalogProvider');
  return context;
}

