'use client';

import { AlertTriangle } from 'lucide-react';

// Se ve cuando el servidor no ha podido leer el catálogo (Supabase caído o
// pausado) y no hay una versión anterior cacheada que servir.
export default function CatalogError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-7xl flex-col px-4 py-6 sm:px-6">
      <section className="engraved flex flex-col items-center gap-3 px-6 py-14 text-center">
        <AlertTriangle className="h-8 w-8 text-signal-red" aria-hidden="true" />
        <p className="legend-text text-signal-red">No se ha podido cargar el catálogo</p>
        <p className="max-w-md font-data text-[11px] text-legend-dim">
          {/* En producción Next oculta el mensaje real de los errores del
              servidor; solo en desarrollo llega entero. */}
          {process.env.NODE_ENV === 'development'
            ? error.message
            : 'Puede ser un fallo momentáneo. Prueba otra vez en un minuto.'}
        </p>
        <button type="button" onClick={reset} className="legend-btn mt-2">
          Reintentar
        </button>
      </section>
    </main>
  );
}
