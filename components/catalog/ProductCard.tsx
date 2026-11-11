'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { getStockState } from '@/lib/stock';
import ProductCarousel from '@/components/catalog/ProductCarousel';
import StockAnnunciator from '@/components/catalog/StockAnnunciator';
import AdminStockControls from '@/components/admin/AdminStockControls';
import ImageManager from '@/components/admin/ImageManager';
import Dialog from '@/components/ui/Dialog';

interface ProductCardProps {
  product: Product;
  /** Las primeras tarjetas cargan su imagen con prioridad. */
  priority?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { isAdmin } = useAuth();
  const { adjustStock, deleteProduct, refresh } = useCatalog();
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
          onAdjustStock={(delta) => adjustStock(product.id, delta)}
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
        {/* Al cambiar las imágenes se refresca el catálogo; si no, el carrusel
            de la tarjeta seguía enseñando las de antes hasta recargar. */}
        <ImageManager productId={product.id} onImagesChanged={refresh} />
      </Dialog>
    </article>
  );
};

export default ProductCard;
