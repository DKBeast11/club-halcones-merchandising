'use client';

import React from 'react';
import { getStockState, STOCK_LAMP, STOCK_LEGEND } from '@/lib/stock';

interface StockAnnunciatorProps {
  stock: number;
}

/**
 * Testigo de disponibilidad. Verde con existencias, ámbar cuando quedan pocas,
 * y una lámpara que no se enciende cuando está agotado: en un barrido de la
 * rejilla se ve qué queda sin leer una sola cifra.
 *
 * Al montarse hace un chequeo (parpadeo) y se queda en su estado real, como el
 * "power-on self test" de un panel. Se anula con "reducir movimiento".
 */
const StockAnnunciator: React.FC<StockAnnunciatorProps> = ({ stock }) => {
  const state = getStockState(stock);

  return (
    <div className={`ann ${STOCK_LAMP[state]}`}>
      <span className="ann-legend">{STOCK_LEGEND[state]}</span>
      <span className="ann-count">
        {stock} ud.
        <span className="sr-only">
          {state === 'agotado' ? ' — agotado' : ' disponibles'}
        </span>
      </span>
      <span className="lamp-test" aria-hidden="true" />
    </div>
  );
};

export default StockAnnunciator;
