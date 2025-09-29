'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { useProducts } from '@/context/ProductContext';

const categories = [
  { id: 'all', name: 'Todos los productos', icon: '🛍️' },
  { id: 'parches', name: 'Parches', icon: '🎖️' },
  { id: 'camisetas', name: 'Camisetas', icon: '👕' },
  { id: 'llaveros', name: 'Llaveros', icon: '🔑' },
  { id: 'miscelanea', name: 'Miscelanea', icon: '🎁' }
];

const SearchAndFilters: React.FC = () => {
  const { searchTerm, selectedCategory, setSearchTerm, setSelectedCategory } = useProducts();

  return (
    <section className="mb-6 space-y-4" aria-label="Filtros y búsqueda de productos">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
          aria-label="Buscar productos"
        />
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            aria-pressed={selectedCategory === category.id}
            aria-label={`Filtrar por ${category.name}`}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span>{category.icon}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
};

export default SearchAndFilters;

