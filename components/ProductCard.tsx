'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useProducts } from '@/context/ProductContext';
import { getStockState } from '@/lib/stock';
import ProductCarousel from './ProductCarousel';
import StockAnnunciator from './StockAnnunciator';
import AdminStockControls from './AdminStockControls';
import ImageManager from './ImageManager';
import Dialog from './ui/Dialog';

interface ProductCardProps {
  product: Product;
  /** Las primeras tarjetas cargan su imagen con prioridad. */
  priority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { isAdmin, updateStock, deleteProduct } = useProducts();
  const [managingImages, setManagingImages] = useState(false);

  const isOut = getStockState(product.stock) === 'agotado';

  return (
    <article className="card" aria-label={product.name}>
      <ProductCarousel
        images={product.images}
        fallbackUrl={product.image_url}
        productName={product.name}
        dimmed={isOut}
        priority={priority}
      />

      <div className="flex flex-1 flex-col gap-1.5 px-4 pt-4">
        <h3
          className={`legend-text text-base leading-tight ${
            isOut ? 'text-legend-dim' : 'text-legend'
          }`}
        >
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[12.5px] leading-snug text-legend-dim">{product.description}</p>
        )}
        <p
          className={`mt-1 font-data text-lg tabular ${
            isOut ? 'text-legend-dim' : 'text-legend'
          }`}
        >
          {product.price.toFixed(2)} €
        </p>
      </div>

      <div className="p-4 pt-3">
        <StockAnnunciator stock={product.stock} />
      </div>

      {/* Los controles siguen operativos con stock 0: es justo cuando hace
          falta reponer. */}
      {isAdmin && (
        <AdminStockControls
          stock={product.stock}
          productName={product.name}
          onStockChange={(newStock) => updateStock(product.id, newStock)}
          onManageImages={() => setManagingImages(true)}
          onDelete={() => deleteProduct(product.id)}
        />
      )}

      <Dialog
        isOpen={managingImages}
        onClose={() => setManagingImages(false)}
        title="Gestionar imágenes"
        subtitle={product.name}
        size="lg"
      >
        <ImageManager productId={product.id} />
      </Dialog>
    </article>
  );
};

export default ProductCard;
