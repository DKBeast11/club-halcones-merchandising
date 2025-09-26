'use client';

import React from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { useProducts } from '@/context/ProductContext';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAdmin, updateStock, deleteProduct, getStockStatus } = useProducts();
  const stockInfo = getStockStatus(product.stock);

  return (
    <article
      className={`card flex flex-col justify-between ${product.stock === 0 ? 'opacity-50 pointer-events-none select-none' : ''}`}
      aria-label={`Producto: ${product.name}`}
    >
      <div>
        <div className="aspect-square relative">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg mb-2 text-white">{product.name}</h3>
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
        </div>
      </div>
      <div className="px-4 pb-4 pt-2 mt-auto">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end">
            <div className={`flex items-center space-x-1 ${stockInfo.color}`}> 
              <Package className="w-4 h-4" />
              <span className="text-sm font-medium capitalize">{stockInfo.status}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-400">{product.price.toFixed(2)}€</span>
            {!isAdmin && product.stock > 0 && (
              <button className="btn-primary px-4 py-2 rounded-lg font-semibold w-1/2">
                Ver Detalles
              </button>
            )}
            {!isAdmin && product.stock === 0 && (
              <button 
                className="bg-gray-600 text-gray-400 py-2 px-4 rounded-lg font-semibold cursor-not-allowed w-1/2"
                disabled
              >
                Agotado
              </button>
            )}
          </div>
          {isAdmin && (
            <div className="space-y-2 pt-3 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  aria-label="Restar 1 unidad de stock"
                  onClick={() => updateStock(product.id, product.stock - 1)}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                  disabled={product.stock <= 0}
                >
                  -1
                </button>
                <span className="text-sm text-gray-300 min-w-[60px] text-center">Stock: {product.stock}</span>
                <button
                  type="button"
                  aria-label="Sumar 1 unidad de stock"
                  onClick={() => updateStock(product.id, product.stock + 1)}
                  className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm transition-colors"
                >
                  +1
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateStock(product.id, product.stock + 10)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>+10</span>
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;

