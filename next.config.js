/** @type {import('next').NextConfig} */

// El host de Supabase se deriva de la URL del proyecto en vez de escribirlo a
// mano, para no tener que tocar este archivo al cambiar de proyecto.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Cubre tanto /object/public/** como /object/sign/** : el catálogo actual
      // usa URLs firmadas con token, no públicas.
      ...(supabaseHost
        ? [
            {
              protocol: 'https',
              hostname: supabaseHost,
              pathname: '/storage/v1/object/**',
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig
