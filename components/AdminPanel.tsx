'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
import { adminFetch } from '@/lib/adminFetch';

interface NewProductForm {
  name: string;
  category: string;
  price: string;
  stock: string;
  image_url: string;
  description: string;
}

const EMPTY_FORM: NewProductForm = {
  name: '',
  // Se rellena con la primera categoría de la tabla en cuanto carga; hasta
  // entonces el desplegable sale vacío y el formulario no deja enviar.
  category: '',
  price: '',
  stock: '',
  image_url: '',
  description: '',
};

const AdminPanel: React.FC = () => {
  const { isAdmin, categories, addProduct, addCategory } = useProducts();

  const [isOpen, setIsOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const [form, setForm] = useState<NewProductForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);

  if (!isAdmin) return null;

  const set = <K extends keyof NewProductForm>(key: K, value: NewProductForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Mientras el formulario no haya tocado la categoría, manda la primera de la
  // tabla. Así el desplegable nunca aparece en blanco si hay categorías.
  const currentCategory = form.category || categories[0]?.id || '';

  const validate = (): boolean => {
    if (!form.name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return false;
    }
    if (!currentCategory) {
      setFormError('La categoría es obligatoria.');
      return false;
    }
    if (!form.price || Number(form.price) <= 0) {
      setFormError('El precio tiene que ser mayor que 0.');
      return false;
    }
    if (form.stock === '' || Number(form.stock) < 0) {
      setFormError('El stock no puede ser negativo.');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setImageFile(null);
    setIsOpen(false);
    setFormError(null);
    setAddingCategory(false);
    setNewCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const created = await addProduct({
        name: form.name.trim(),
        category: currentCategory,
        price: Number(form.price),
        stock: Number(form.stock),
        image_url: form.image_url || undefined,
        description: form.description.trim(),
      });

      // La imagen se registra aparte: o el archivo subido, o la URL indicada.
      if (imageFile || form.image_url) {
        const body = new FormData();
        body.append('productId', created.id);
        if (imageFile) body.append('file', imageFile);
        else body.append('imageUrl', form.image_url);

        const res = await adminFetch('/api/admin/images', { method: 'POST', body });
        if (!res.ok) throw new Error('El producto se ha creado, pero la imagen ha fallado.');
      }

      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se ha podido guardar el producto.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Antes esto solo añadía la categoría a un useState: el desplegable la
  // mostraba, pero no existía en ninguna parte y la fila la rechazaba la base
  // de datos al guardar el producto. Ahora se da de alta de verdad y queda
  // disponible para el resto del catálogo.
  const handleAddCategory = async () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const created = await addCategory(trimmed);
      set('category', created.id);
      setNewCategory('');
      setAddingCategory(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'No se ha podido crear la categoría.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="surface" aria-label="Panel de administración">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h2 className="legend-text text-sm text-signal-amber">Panel de administración</h2>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          disabled={isSubmitting}
          className="btn-success flex items-center gap-2"
        >
          {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isOpen ? 'Cerrar' : 'Añadir producto'}
        </button>
      </div>

      {isOpen && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 border-t border-panel-edge p-4"
        >
          {formError && (
            <p
              role="alert"
              className="engraved border-signal-red/50 px-3 py-2 font-data text-[11px] text-signal-red"
            >
              {formError}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-name" className="legend-text text-[11px] text-legend-dim">
                Nombre *
              </label>
              <input
                id="p-name"
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                className="input-field"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-category" className="legend-text text-[11px] text-legend-dim">
                Categoría *
              </label>
              {!addingCategory ? (
                <select
                  id="p-category"
                  value={currentCategory}
                  onChange={(e) =>
                    e.target.value === '__new__'
                      ? setAddingCategory(true)
                      : set('category', e.target.value)
                  }
                  className="input-field"
                  disabled={isSubmitting}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="__new__">+ Crear nueva categoría</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la categoría"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="input-field flex-1"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    disabled={isSubmitting || !newCategory.trim()}
                    className="btn-success px-3"
                  >
                    OK
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewCategory('');
                      setAddingCategory(false);
                    }}
                    disabled={isSubmitting}
                    className="btn-secondary px-3"
                  >
                    No
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-price" className="legend-text text-[11px] text-legend-dim">
                Precio (€) *
              </label>
              <input
                id="p-price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className="input-field font-data tabular"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-stock" className="legend-text text-[11px] text-legend-dim">
                Stock inicial *
              </label>
              <input
                id="p-stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                className="input-field font-data tabular"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-url" className="legend-text text-[11px] text-legend-dim">
                URL de imagen
              </label>
              <input
                id="p-url"
                type="url"
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
                className="input-field font-data text-[12px]"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="p-file" className="legend-text text-[11px] text-legend-dim">
                O subir archivo
              </label>
              <input
                id="p-file"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="input-field file:mr-3 file:border-0 file:bg-panel-edge file:px-3 file:py-1 file:font-legend file:uppercase file:tracking-legend file:text-[11px] file:text-legend"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-desc" className="legend-text text-[11px] text-legend-dim">
              Descripción
            </label>
            <textarea
              id="p-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="input-field resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : 'Añadir producto'}
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
    </section>
  );
};

export default AdminPanel;
