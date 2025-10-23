import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ¡CAMBIO IMPORTANTE! Definimos nuestros colores aquí
  theme: {
    extend: {
      colors: {
        'background-dark': '#0f172a',
        'container-dark': '#1e293b',
        'text-light': '#e2e8f0',
        'text-muted': '#94a3b8',
        'accent-blue': '#2563eb',
      },
    },
  },
   plugins: [
    require('@tailwindcss/typography'), // <-- AÑADE ESTA LÍNEA
  ]
}
export default config