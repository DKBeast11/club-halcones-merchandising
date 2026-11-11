'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import Header from './Header';
import SearchAndFilters from './SearchAndFilters';
import AdminPanel from './AdminPanel';
import ProductGrid from './ProductGrid';
import SessionStatus from './SessionStatus';
import { useAuth } from '@/context/AuthContext';
import { useCatalog } from '@/context/CatalogContext';
import { ALL_CATEGORIES } from '@/lib/catalog';

const MerchandiseCatalog: React.FC = () => {
  const { isAdmin } = useAuth();
  const { actionError, dismissActionError } = useCatalog();

  // La búsqueda y el filtro solo los usan la barra y la rejilla, así que
  // viven aquí y no en un contexto global como antes.
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);

  return (
    <>
      <Header />
      <SessionStatus />
      <main
        className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6"
        aria-label="Catálogo de merchandising"
      >
        <SearchAndFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
        {isAdmin && <AdminPanel />}
        {actionError && (
          <div
            role="alert"
            className="engraved flex items-start justify-between gap-3 border-signal-red/50 px-3 py-2 font-data text-[11px] text-signal-red"
          >
            <span>{actionError}</span>
            <button
              type="button"
              onClick={dismissActionError}
              aria-label="Cerrar aviso"
              className="shrink-0 hover:text-legend"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <ProductGrid searchTerm={searchTerm} selectedCategory={selectedCategory} />
      </main>
    </>
  );
};

export default MerchandiseCatalog;
