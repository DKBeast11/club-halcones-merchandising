'use client';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import ImageManager from './ImageManager';

// Tipos locales para mejor tipo de dato
interface NewProduct {
  name: string;
  category: string;
  price: string;
  stock: string;
  image_url: string;
  description: string;
}

const INITIAL_CATEGORIES = ['parches', 'camisetas', 'llaveros', 'miscelanea'];

const INITIAL_PRODUCT_STATE: NewProduct = {
  name: '',
  category: 'parches',
  price: '',
  stock: '',
  image_url: '',
  description: ''
};

const AdminPanel: React.FC = () => {
  const { isAdmin, addProduct, products } = useProducts();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para categorías
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  // Estado del producto
  const [newProduct, setNewProduct] = useState<NewProduct>(INITIAL_PRODUCT_STATE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  // State for ImageManager (must be declared with other hooks)
  const [managingProductId, setManagingProductId] = useState<string | null>(null);

  // Si no es admin, no mostrar nada
  if (!isAdmin) return null;

  // Image upload is now handled by ImageManager and server-side API routes.

  const validateForm = (): boolean => {
    if (!newProduct.name.trim()) {
      setFormError('El nombre del producto es obligatorio');
      return false;
    }
    if (!newProduct.category) {
      setFormError('La categoría es obligatoria');
      return false;
    }
    if (!newProduct.price || Number(newProduct.price) <= 0) {
      setFormError('El precio debe ser mayor a 0');
      return false;
    }
    if (!newProduct.stock || Number(newProduct.stock) < 0) {
      setFormError('El stock no puede ser negativo');
      return false;
    }
    return true;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Preparar datos del producto con tipos correctos
      const productData = {
        name: newProduct.name.trim(),
        category: newProduct.category as "parches" | "camisetas" | "llaveros",
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        image_url: newProduct.image_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
        description: newProduct.description.trim()
      };

      // Primero, crear el producto para obtener su id
      const created = await addProduct(productData);

      // Si se seleccionó un archivo, subirlo mediante el endpoint server
      if (imageFile) {
        const form = new FormData();
        form.append('file', imageFile);
        form.append('productId', created.id);

        const resp = await fetch('/api/admin/images', { method: 'POST', body: form });
        if (!resp.ok) throw new Error('Error al subir la imagen');
      } else if (newProduct.image_url) {
        // Si se proporcionó solo una URL, insertar como image record
        const form = new FormData();
        form.append('imageUrl', newProduct.image_url);
        form.append('productId', created.id);
        const resp = await fetch('/api/admin/images', { method: 'POST', body: form });
        if (!resp.ok) throw new Error('Error al crear registro de imagen');
      }

      resetForm();
      
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el producto. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewProduct(INITIAL_PRODUCT_STATE);
    setImageFile(null);
    setShowAddProduct(false);
    setFormError(null);
    setAddingCategory(false);
    setNewCategory('');
  };

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim().toLowerCase();
    
    if (!trimmedCategory) return;
    
    if (categories.includes(trimmedCategory)) {
      setFormError('Esta categoría ya existe');
      return;
    }
    
    setCategories(prev => [...prev, trimmedCategory]);
    setNewProduct(prev => ({ ...prev, category: trimmedCategory }));
    setNewCategory('');
    setAddingCategory(false);
    setFormError(null);
  };

  const handleCancelCategory = () => {
    setNewCategory('');
    setAddingCategory(false);
  };

  const handleCategorySelect = (value: string) => {
    if (value === '__add_new__') {
      setAddingCategory(true);
    } else {
      setNewProduct(prev => ({ ...prev, category: value }));
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-400">Panel de Administración</h2>
        <button
          type="button"
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="btn-success flex items-center space-x-2"
          disabled={isSubmitting}
        >
          <Plus className="w-4 h-4" />
          <span>{showAddProduct ? 'Cerrar' : 'Añadir Producto'}</span>
        </button>
      </div>

      {showAddProduct && (
        <form className="bg-gray-700 p-4 rounded-lg space-y-4" onSubmit={handleAddProduct}>
          {formError && (
            <div className="text-red-500 font-semibold mb-2 p-2 bg-red-100 dark:bg-red-900 rounded">
              {formError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del producto */}
            <input
              type="text"
              placeholder="Nombre del producto *"
              value={newProduct.name}
              onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              required
              disabled={isSubmitting}
            />

            {/* Selector de categoría */}
            {!addingCategory ? (
              <select
                value={newProduct.category}
                onChange={(e) => handleCategorySelect(e.target.value)}
                className="input-field"
                disabled={isSubmitting}
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
                <option value="__add_new__">+ Crear nueva categoría</option>
              </select>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="input-field flex-1"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="btn-primary px-3 py-2"
                  onClick={handleAddCategory}
                  disabled={isSubmitting || !newCategory.trim()}
                >
                  ✓
                </button>
                <button
                  type="button"
                  className="btn-secondary px-3 py-2"
                  onClick={handleCancelCategory}
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            )}

            {/* Precio */}
            <input
              type="number"
              placeholder="Precio (€) *"
              value={newProduct.price}
              onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
              className="input-field"
              min="0"
              step="0.01"
              required
              disabled={isSubmitting}
            />

            {/* Stock */}
            <input
              type="number"
              placeholder="Stock inicial *"
              value={newProduct.stock}
              onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
              className="input-field"
              min="0"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* URL de imagen */}
            <input
              type="url"
              placeholder="URL de la imagen (opcional)"
              value={newProduct.image_url}
              onChange={(e) => setNewProduct(prev => ({ ...prev, image_url: e.target.value }))}
              className="input-field"
              disabled={isSubmitting}
            />

            {/* Archivo de imagen */}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="input-field"
              disabled={isSubmitting}
            />
          </div>

          {/* Descripción */}
          <textarea
            placeholder="Descripción del producto"
            value={newProduct.description}
            onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
            className="input-field h-20 resize-none"
            disabled={isSubmitting}
          />

          {/* Botones de acción */}
          <div className="flex space-x-3">
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : 'Añadir Producto'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Product list with Manage Images */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-white mb-2">Productos</h3>
        <div className="grid gap-2">
          {/** Render a simplified list; use products from context */}
          {/** eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between bg-gray-700 p-2 rounded">
              <div className="text-sm text-white">{p.name}</div>
              <div className="flex gap-2">
                <button className="btn-secondary text-xs" onClick={() => setManagingProductId(p.id)}>
                  Gestionar imágenes
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {managingProductId && (
        <div className="mt-4">
          <ImageManager productId={managingProductId} onClose={() => setManagingProductId(null)} />
        </div>
      )}
    </div>
  );
};

export default AdminPanel;