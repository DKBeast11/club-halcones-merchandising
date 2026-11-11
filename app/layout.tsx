import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Club Halcones - Merchandising Oficial',
  description: 'Tienda oficial de merchandising del Club Halcones - F-18 & Eurofighter',
  keywords: 'F-18, Eurofighter, merchandising, parches, camisetas, llaveros, aviación',
  authors: [{ name: 'Club Halcones' }],
}

// Desde Next 14 el viewport va en su propio export, no dentro de metadata.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* El catálogo trae su propio provider desde app/page.tsx, con los
            datos ya leídos en el servidor. Aquí solo queda la sesión. */}
        <AuthProvider>{children}</AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}

