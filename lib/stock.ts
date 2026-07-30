export type StockState = 'disponible' | 'ultimas' | 'agotado';

/** Por debajo de esta cifra el testigo pasa a ámbar. */
export const LOW_STOCK_THRESHOLD = 5;

export function getStockState(stock: number): StockState {
  if (stock <= 0) return 'agotado';
  if (stock <= LOW_STOCK_THRESHOLD) return 'ultimas';
  return 'disponible';
}

/** Rótulo grabado en el testigo. */
export const STOCK_LEGEND: Record<StockState, string> = {
  disponible: 'Disponible',
  ultimas: 'Últimas',
  agotado: 'Agotado',
};

/** Clase de iluminación del testigo. */
export const STOCK_LAMP: Record<StockState, string> = {
  disponible: 'ann-ok',
  ultimas: 'ann-warn',
  agotado: 'ann-dark',
};
