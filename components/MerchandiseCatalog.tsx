'use client';

import React from 'react';
import Header from './Header';
import SearchAndFilters from './SearchAndFilters';
import AdminPanel from './AdminPanel';
import ProductGrid from './ProductGrid';
import SessionStatus from './SessionStatus';
import { useProducts } from '@/context/ProductContext';

const MerchandiseCatalog: React.FC = () => {
  const { isAdmin } = useProducts();

  return (
    <main className="min-h-screen bg-gray-900 text-white" aria-label="Catálogo de productos Club Halcones">
      <Header />
      <SessionStatus />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <SearchAndFilters />
        {isAdmin && <AdminPanel />}
        <ProductGrid />
      </div>
    </main>
  );
};

export default MerchandiseCatalog;

