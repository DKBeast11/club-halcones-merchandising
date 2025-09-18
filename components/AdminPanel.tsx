'use client';
import * as React from 'react';
import { Plus } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';
const AdminPanel: React.FC = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [loadingAdmin, setLoadingAdmin] = React.useState(true);
  React.useEffect(() => {
    async function checkAdmin() {
      // @ts-ignore
      const { supabase } = await import('@/lib/supabase');
      const { data: userData } = await supabase.auth.getUser();
      const uuid = userData?.user?.id;
      if (!uuid) {
        setIsAdmin(false);
        setLoadingAdmin(false);
        return;
      }
      const { data: admin } = await supabase
        .from('admins')
        .select('uuid')
        .eq('uuid', uuid)
        .single();
      setIsAdmin(!!admin);
      setLoadingAdmin(false);
    }
    checkAdmin();
  }, []);

  // Mostrar el UUID del usuario autenticado en la consola
  React.useEffect(() => {
    async function getUserId() {
      // @ts-ignore
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase.auth.getUser();
      console.log('Mi UUID:', data?.user?.id);
    }
    getUserId();
  }, []);

  // Estados y lógica del formulario
  const [showAddProduct, setShowAddProduct] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [newProduct, setNewProduct] = React.useState<{
    name: string;
    category: 'parches' | 'camisetas' | 'llaveros';
    price: string;
    stock: string;
    image_url: string;
    description: string;
  }>({
    name: '',
    category: 'parches',
    price: '',
    stock: '',
    image_url: '',
    description: ''
  });
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const { addProduct } = useProducts();

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
  let imageUrl: string = newProduct.image_url;
    if (imageFile) {
      // @ts-ignore
      const { supabase } = await import('@/lib/supabase');
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, imageFile);
      if (error) {
        setFormError('Error al subir la imagen');
        return;
      }
      const { data: publicData } = await supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      imageUrl = publicData?.publicUrl || imageUrl;
    }
    const productData = {
      name: newProduct.name.trim(),
      category: newProduct.category,
      price: Number(newProduct.price),
      stock: Number(newProduct.stock),
      image_url: imageUrl || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
      description: newProduct.description?.trim()
    };
    try {
      await addProduct(productData);
      setImageFile(null);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || 'Error al guardar el producto. Revisa los datos e inténtalo de nuevo.');
    }
  }

  const resetForm = () => {
    setNewProduct({
      name: '',
      category: 'parches',
      price: '',
      stock: '',
      image_url: '',
      description: ''
    });
    setShowAddProduct(false);
  };

  if (loadingAdmin) return null;
  if (!isAdmin) return null;
  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-400">Panel de Administración</h2>
        <button
          type="button"
          aria-label={showAddProduct ? 'Cerrar formulario de producto' : 'Abrir formulario de producto'}
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="btn-success flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Producto</span>
        </button>
      </div>

      {showAddProduct && (
        <form className="bg-gray-700 p-4 rounded-lg space-y-4" onSubmit={handleAddProduct}>
          {formError && (
            <div className="text-red-500 font-semibold mb-2">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre del producto"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="input-field"
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value as 'parches' | 'camisetas' | 'llaveros'})}
              className="input-field"
            >
              <option value="parches">Parches</option>
              <option value="camisetas">Camisetas</option>
              <option value="llaveros">Llaveros</option>
            </select>
            <input
              type="number"
              placeholder="Precio (€)"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              className="input-field"
              min="0"
              step="0.01"
            />
            <input
              type="number"
              placeholder="Stock inicial"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
              className="input-field"
              min="0"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="url"
              placeholder="URL de la imagen (opcional)"
              value={newProduct.image_url}
              onChange={(e) => setNewProduct({...newProduct, image_url: e.target.value})}
              className="input-field"
            />
            <input
              type="file"
              accept="image/*"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              className="input-field"
            />
          </div>
          <textarea
            placeholder="Descripción del producto"
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
            className="input-field h-20 resize-none"
          />
          <div className="flex space-x-3">
            <button
              type="submit"
              className="btn-primary"
            >
              Añadir Producto
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );

export default AdminPanel;

