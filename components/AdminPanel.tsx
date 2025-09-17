'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';

const AdminPanel: React.FC = () => {
  const {
    showAddProduct,
    newProduct,
    setShowAddProduct,
    setNewProduct,
    addProduct
  } = useProducts();

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;
    
    const productData = {
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      image: newProduct.image || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop',
      description: newProduct.description
    };
    
    addProduct(productData);
  };

  const resetForm = () => {
    setNewProduct({
      name: '',
      category: 'parches',
      price: '',
      stock: '',
      image: '',
      description: ''
    });
    setShowAddProduct(false);
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-red-400">Panel de Administración</h2>
        <button
          onClick={() => setShowAddProduct(!showAddProduct)}
          className="btn-success flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Añadir Producto</span>
        </button>
      </div>

      {showAddProduct && (
        <div className="bg-gray-700 p-4 rounded-lg space-y-4">
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
          <input
            type="url"
            placeholder="URL de la imagen (opcional)"
            value={newProduct.image}
            onChange={(e) => setNewProduct({...newProduct, image: e.target.value})}
            className="input-field"
          />
          <textarea
            placeholder="Descripción del producto"
            value={newProduct.description}
            onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
            className="input-field h-20 resize-none"
          />
          <div className="flex space-x-3">
            <button
              onClick={handleAddProduct}
              className="btn-primary"
            >
              Añadir Producto
            </button>
            <button
              onClick={resetForm}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

