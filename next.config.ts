import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. Abilitiamo i domini esterni per le immagini (Supabase Storage) */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Permette immagini caricate su Supabase
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
  },

  /* 2. Ottimizzazione build: ignoriamo i warning di ESLint in fase di build su Vercel 
     (Opzionale: usalo solo se hai piccoli warning che bloccano il deploy ma vuoi andare online) */
  eslint: {
    ignoreDuringBuilds: false,
  },

  /* 3. Se usi pacchetti che non supportano ancora pienamente ESM/Next 15 */
  transpilePackages: ['leaflet', 'react-leaflet'],
};

export default nextConfig;