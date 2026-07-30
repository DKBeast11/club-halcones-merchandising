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
    <>
      <Header />
      <SessionStatus />
      <main
        className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6"
        aria-label="Catálogo de merchandising"
      >
        <SearchAndFilters />
        {isAdmin && <AdminPanel />}
        <ProductGrid />
      </main>
    </>
  );
};

export default MerchandiseCatalog;
