'use client';

import React, { useMemo } from 'react';
import { Package } from 'lucide-react';
import ProductCard from './ProductCard';
import { useCatalog } from '@/context/CatalogContext';
import { ALL_CATEGORIES } from '@/lib/catalog';

/** Tarjetas de la primera fila: cargan su imagen con prioridad. */
const PRIORITY_COUNT = 4;

interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ searchTerm, selectedCategory }) => {
  const { products } = useCatalog();

  const visibleProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesSearch =
        !term ||
        product.name.toLowerCase().includes(term) ||
        (product.description?.toLowerCase().includes(term) ?? false);
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Los agotados van al final; el resto, por nombre.
    return filtered.sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1;
      if (a.stock > 0 && b.stock === 0) return -1;
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }, [products, searchTerm, selectedCategory]);

  if (visibleProducts.length === 0) {
    const filtering = searchTerm.trim() !== '' || selectedCategory !== ALL_CATEGORIES;
    return (
      <section className="engraved flex flex-col items-center gap-2 px-6 py-14 text-center">
        <Package className="h-8 w-8 text-legend-dim" aria-hidden="true" />
        <p className="legend-text text-legend">
          {filtering ? 'Sin resultados' : 'El catálogo está vacío'}
        </p>
        <p className="font-data text-[11px] text-legend-dim">
          {filtering
            ? 'Prueba con otra búsqueda o quita los filtros.'
            : 'Entra como admin para añadir el primer producto.'}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Listado de productos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < PRIORITY_COUNT} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;
