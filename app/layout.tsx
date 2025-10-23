import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Chatbot from '../components/Chatbot'
import AuthProvider from '../app/providers/AuthProvider'
import { Toaster } from 'react-hot-toast' // 1. IMPORTAMOS EL TOASTER

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NeuroSync AI',
  description: 'Tu gimnasio y entrenador personal para el cerebro.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {/* 2. AÑADIMOS EL COMPONENTE TOASTER AQUÍ */}
          <Toaster 
            position="bottom-center" // Posición ideal para móviles
            toastOptions={{
              // Estilos para el modo oscuro
              style: {
                background: '#1e293b', // slate-800
                color: '#e2e8f0',       // slate-200
              },
              // Estilos específicos para notificaciones de éxito y error
              success: {
                iconTheme: {
                  primary: '#4ade80', // green-400
                  secondary: 'white',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f87171', // red-400
                  secondary: 'white',
                },
              },
            }}
          />
          {children}
          <Chatbot />
        </AuthProvider>
      </body>
    </html>
  )
}