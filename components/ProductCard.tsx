'use client';

import React, { useState, useRef } from 'react';
import { Package, Trash2, Image } from 'lucide-react';
import { Product } from '@/types';
import { useProducts } from '@/context/ProductContext';
import ImageManager from './ImageManager';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isAdmin, updateStock, deleteProduct, getStockStatus } = useProducts();
  const [managingImages, setManagingImages] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const stockInfo = getStockStatus(product.stock);

  return (
    <article
      className={`card flex flex-col justify-between ${product.stock === 0 ? 'opacity-50 pointer-events-none select-none' : ''}`}
      aria-label={`Producto: ${product.name}`}
    >
      <div>
        <div
          className="aspect-square relative overflow-hidden"
          onKeyDown={(e) => {
            if (product.images && product.images.length > 1) {
              if (e.key === 'ArrowRight') setCurrentIndex((i) => (i + 1) % product.images!.length);
              if (e.key === 'ArrowLeft') setCurrentIndex((i) => (i - 1 + product.images!.length) % product.images!.length);
            }
          }}
          tabIndex={0}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
          onTouchEnd={() => {
            if (touchStartX.current !== null && touchEndX.current !== null) {
              const dx = touchStartX.current - touchEndX.current;
              const threshold = 50; // px
              if (dx > threshold && product.images && product.images.length > 1) {
                // swipe left -> next
                setCurrentIndex((i) => (i + 1) % product.images!.length);
              } else if (dx < -threshold && product.images && product.images.length > 1) {
                // swipe right -> prev
                setCurrentIndex((i) => (i - 1 + product.images!.length) % product.images!.length);
              }
            }
            touchStartX.current = null;
            touchEndX.current = null;
          }}
        >
          {product.images && product.images.length > 1 ? (
            // Carousel view
            <>
              {product.images.map((img, idx) => (
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={`${product.name} - ${idx + 1}`}
                  className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${idx === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                />
              ))}

              {/* Prev / Next buttons */}
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => setCurrentIndex((i) => (i - 1 + product.images!.length) % product.images!.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={() => setCurrentIndex((i) => (i + 1) % product.images!.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full"
              >
                ›
              </button>

              {/* Indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    aria-label={`Ir a la imagen ${idx + 1}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-gray-400'}`}
                  />
                ))}
              </div>
            </>
          ) : (
            // Single image fallback
            <img
              src={
                (product.images && product.images.length > 0 && product.images[0].image_url) 
                  || product.image_url 
                  || 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop'
              }
              alt={product.name}
              className="w-full h-full object-cover"
            />
          )}
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
                  aria-label="Restar 10 unidades de stock"
                  onClick={() => updateStock(product.id, Math.max(0, product.stock - 10))}
                  className="bg-red-700 hover:bg-red-800 text-white px-2 py-1 rounded text-sm transition-colors"
                  disabled={product.stock <= 0}
                >
                  -10
                </button>
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
                <button
                  type="button"
                  aria-label="Sumar 10 unidades de stock"
                  onClick={() => updateStock(product.id, product.stock + 10)}
                  className="bg-green-700 hover:bg-green-800 text-white px-2 py-1 rounded text-sm transition-colors"
                >
                  +10
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setManagingImages(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex items-center space-x-1 transition-colors"
                >
                  <Image className="w-3 h-3" />
                  <span>Gestionar Imágenes</span>
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
      
      {/* Modal de gestión de imágenes */}
      {managingImages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Gestionar Imágenes - {product.name}</h2>
              <button
                onClick={() => setManagingImages(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <ImageManager productId={product.id} onClose={() => setManagingImages(false)} />
          </div>
        </div>
      )}
    </article>
  );
};

export default ProductCard;

