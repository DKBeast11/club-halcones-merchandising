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
    <div className="card">
      <div className="aspect-square relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-bold ${stockInfo.bgColor} ${stockInfo.color}`}>
          {product.stock === 0 ? 'AGOTADO' : `${product.stock} uds`}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 text-white">{product.name}</h3>
        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-400">{product.price.toFixed(2)}€</span>
          <div className={`flex items-center space-x-1 ${stockInfo.color}`}>
            <Package className="w-4 h-4" />
            <span className="text-sm font-medium capitalize">{stockInfo.status}</span>
          </div>
        </div>

        {isAdmin && (
          <div className="space-y-2 pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateStock(product.id, product.stock - 1)}
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
                disabled={product.stock <= 0}
              >
                -1
              </button>
              <span className="text-sm text-gray-300 min-w-[60px] text-center">Stock: {product.stock}</span>
              <button
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

        {!isAdmin && product.stock > 0 && (
          <button className="w-full btn-primary">
            Ver Detalles
          </button>
        )}

        {!isAdmin && product.stock === 0 && (
          <button 
            className="w-full bg-gray-600 text-gray-400 py-2 px-4 rounded-lg font-semibold cursor-not-allowed"
            disabled
          >
            Agotado
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;

