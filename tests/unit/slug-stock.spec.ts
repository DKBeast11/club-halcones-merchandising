import { test, expect } from '@playwright/test';
import { toSlug } from '@/lib/slug';
import { getStockState, LOW_STOCK_THRESHOLD, STOCK_LAMP, STOCK_LEGEND } from '@/lib/stock';

test.describe('toSlug', () => {
  test('las cuatro categorías de siempre conservan su id', () => {
    // Si esto cambia, products.category deja de casar con categories.id.
    expect(toSlug('Parches')).toBe('parches');
    expect(toSlug('Camisetas')).toBe('camisetas');
    expect(toSlug('Llaveros')).toBe('llaveros');
    expect(toSlug('Miscelánea')).toBe('miscelanea');
  });

  test('quita acentos, espacios y signos', () => {
    expect(toSlug('  Gorras y Viseras ')).toBe('gorras-y-viseras');
    expect(toSlug('Ñandú & Cía.')).toBe('nandu-cia');
    expect(toSlug('--hola--')).toBe('hola');
  });

  test('no pasa de 50 caracteres, el tope de categories.id', () => {
    expect(toSlug('a'.repeat(80))).toHaveLength(50);
  });

  test('un nombre sin letras ni números da cadena vacía', () => {
    // La API de categorías tiene que rechazarlo: no hay id posible.
    expect(toSlug('¡¿?!')).toBe('');
  });
});

test.describe('getStockState', () => {
  test('cero o menos es agotado', () => {
    expect(getStockState(0)).toBe('agotado');
    expect(getStockState(-3)).toBe('agotado');
  });

  test('hasta el umbral son "últimas"; por encima, disponible', () => {
    expect(getStockState(1)).toBe('ultimas');
    expect(getStockState(LOW_STOCK_THRESHOLD)).toBe('ultimas');
    expect(getStockState(LOW_STOCK_THRESHOLD + 1)).toBe('disponible');
  });

  test('cada estado tiene rótulo y lámpara', () => {
    for (const state of ['disponible', 'ultimas', 'agotado'] as const) {
      expect(STOCK_LEGEND[state]).toBeTruthy();
      // Las clases ann-* están en globals.css; si se renombran, el testigo
      // sale sin iluminar sin ningún error visible.
      expect(STOCK_LAMP[state]).toMatch(/^ann-/);
    }
  });
});
