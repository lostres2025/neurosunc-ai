/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Dejamos esto por si acaso, no hace daño
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig