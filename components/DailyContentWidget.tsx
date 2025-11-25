"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Icono decorativo
const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-yellow-400">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

export default function DailyContentWidget() {
  const { status } = useSession();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Esperar a que la sesión termine de cargar
    if (status === 'loading') return;

    // Si no está autenticado, no intentamos cargar nada
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    const fetchDailyContent = async () => {
      try {
        // 2. Llamada a la API (Ruta relativa, segura)
        // La API verifica la sesión internamente usando auth()
        const response = await fetch('/api/daily-content');
        
        if (response.ok) {
          const data = await response.json();
          // La API devuelve un objeto { content: "texto..." }
          setContent(data.content);
        } else {
          // Mensaje amable si falla la red o el servidor
          setContent("El conocimiento de hoy se está cargando... Intenta recargar la página.");
        }
      } catch (error) {
        console.error("Error fetching daily content:", error);
        // Fallback por si todo falla estrepitosamente
        setContent("Recuerda hidratarte para mantener tu cerebro activo."); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyContent();
  }, [status]);

  // Si no hay sesión iniciada, no mostramos el widget
  if (status !== 'authenticated') return null;

  return (
    <div className="widget bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <SparkleIcon />
        <h2 className="widget-title text-white m-0">Píldora Cognitiva</h2>
      </div>
      
      <div className="min-h-[60px] flex items-center">
        {isLoading ? (
          <div className="flex gap-2 items-center text-slate-400 text-sm animate-pulse">
            {/* Animación de carga: puntos rebotando */}
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <span className="ml-2">Generando contenido con IA...</span>
          </div>
        ) : (
          <p className="text-indigo-100 text-sm leading-relaxed italic">
            "{content}"
          </p>
        )}
      </div>
    </div>
  );
}