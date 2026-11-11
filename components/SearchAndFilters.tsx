'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { ALL_CATEGORIES } from '@/lib/catalog';

const ALL = { id: ALL_CATEGORIES, name: 'Todo' };

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchTermChange,
  selectedCategory,
  onCategoryChange,
}) => {
  const { categories } = useCatalog();

  // Antes esta lista estaba escrita a mano aquí, así que una categoría nueva
  // no llegaba nunca a la barra. Ahora sale de la tabla `categories`, con su
  // nombre y su orden.
  const filters = [ALL, ...categories];

  return (
    <section className="flex flex-wrap gap-3" aria-label="Búsqueda y filtros">
      <div className="engraved flex flex-1 basis-52 items-center gap-2.5 px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-legend-dim" aria-hidden="true" />
        <input
          type="search"
          placeholder="Buscar productos"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          aria-label="Buscar productos"
          className="w-full bg-transparent font-data text-[12.5px] text-legend placeholder-legend-dim focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        {filters.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={selectedCategory === category.id}
            onClick={() => onCategoryChange(category.id)}
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
