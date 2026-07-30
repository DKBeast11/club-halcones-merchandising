/** @type {import('tailwindcss').Config} */

// Dirección visual "Panel de vuelo". El catálogo se lee como un panel de
// instrumentos: la disponibilidad es un testigo luminoso, no una etiqueta.
// Los tres colores de señal son semánticos y no se usan para decorar.
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // lib/stock.ts mapea estados a clases del testigo: sin esto se purgan.
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        panel: {
          DEFAULT: '#1B1D1A', // carbón cálido, virado a verde
          raised: '#2C302B',  // superficie en relieve
          engrave: '#141613', // hueco grabado
          edge: '#3A3F38',    // canto / borde
        },
        legend: {
          DEFAULT: '#D5D8D0', // rotulación
          dim: '#9AA098',     // rotulación apagada
        },
        signal: {
          green: '#7FB069',
          amber: '#E8A33D',
          red: '#C1453B',
        },
      },
      fontFamily: {
        // Bahnschrift es la DIN 1451 que trae Windows: la letra de las placas
        // de cabina. Sin descarga y con caída razonable en macOS.
        legend: [
          '"Bahnschrift Condensed"',
          '"Bahnschrift SemiCondensed"',
          'Bahnschrift',
          '"Avenir Next Condensed"',
          '"Franklin Gothic Medium"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        data: ['Consolas', '"SF Mono"', 'Menlo', '"DejaVu Sans Mono"', 'monospace'],
      },
      letterSpacing: {
        legend: '0.15em',
      },
      keyframes: {
        // Chequeo de testigos al cargar: parpadean y se quedan en su estado real.
        bist: {
          '0%': { opacity: '0.5' },
          '22%': { opacity: '0' },
          '40%': { opacity: '0.5' },
          '62%': { opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        bist: 'bist 1.5s steps(1, end) 1 both',
      },
    },
  },
  plugins: [],
}
