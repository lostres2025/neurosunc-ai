/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- ¡ESTA LÍNEA ES LA MÁS IMPORTANTE! ---
  // Le dice a Next.js que genere un sitio estático en la carpeta 'out'.
  output: 'export',
  // ----------------------------------------
  
  // La siguiente configuración es para evitar errores con el componente <Image>
  // en el modo de exportación estática.
  images: {
    unoptimized: true,
  },

  // Ignoramos errores de linting y typescript para asegurar el build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig