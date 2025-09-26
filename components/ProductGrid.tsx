'use client';

import React from 'react';
import { Package } from 'lucide-react';
import ProductCard from './ProductCard';
import { useProducts } from '@/context/ProductContext';

const ProductGrid: React.FC = () => {
  const { products, searchTerm, selectedCategory } = useProducts();

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Ordenar: productos con stock 0 al final, el resto por nombre (sort estable)
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.stock === 0 && b.stock > 0) return 1;
    if (a.stock > 0 && b.stock === 0) return -1;
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });

  if (sortedProducts.length === 0) {
    return (
      <section className="text-center py-12" aria-label="Sin productos">
        <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400 text-lg">No se encontraron productos</p>
        <p className="text-gray-500">Prueba a cambiar los filtros de búsqueda</p>
      </section>
    );
  }

  return (
    <section aria-label="Listado de productos">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedProducts.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ProductGrid;

