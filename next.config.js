/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true }, // Mantenemos esto por compatibilidad
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
}
module.exports = nextConfig