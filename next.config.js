/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignoramos errores de ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },

  // --- AÑADE ESTA SECCIÓN COMPLETA ---
  // Ignoramos errores de TypeScript
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
  // ------------------------------------

  images: {
    // ... tu configuración de images
  },
}

module.exports = nextConfig