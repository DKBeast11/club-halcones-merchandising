'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';

const CATEGORIES = [
  { id: 'all', name: 'Todo' },
  { id: 'parches', name: 'Parches' },
  { id: 'camisetas', name: 'Camisetas' },
  { id: 'llaveros', name: 'Llaveros' },
  { id: 'miscelanea', name: 'Miscelánea' },
];

const SearchAndFilters: React.FC = () => {
  const { searchTerm, selectedCategory, setSearchTerm, setSelectedCategory } = useProducts();

  return (
    <section className="flex flex-wrap gap-3" aria-label="Búsqueda y filtros">
      <div className="engraved flex flex-1 basis-52 items-center gap-2.5 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-legend-dim" aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar productos"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Buscar productos"
          className="w-full bg-transparent font-data text-[12.5px] text-legend placeholder-legend-dim focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={selectedCategory === category.id}
            onClick={() => setSelectedCategory(category.id)}
            className="legend-btn"
          >
            {category.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default SearchAndFilters;
