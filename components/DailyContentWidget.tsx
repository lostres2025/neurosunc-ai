"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const CheckIcon = () => (
  <svg className="insight-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default function InsightsWidget() {
  const { status } = useSession();
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Si no ha cargado la sesión o no está logueado, no hacemos nada aún
    if (status === 'loading') return;
    
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    const fetchInsights = async () => {
      try {
        // 2. CAMBIO CLAVE: Ruta relativa y sin enviar ID (la API lee la cookie)
        const response = await fetch('/api/insights');
        
        if (response.ok) {
          const data = await response.json();
          // Solo actualizamos si 'insights' es un array válido
          if (Array.isArray(data.insights)) {
            setInsights(data.insights);
          }
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [status]); // Solo dependemos del status de la sesión

  // Si está cargando, o si no hay insights, no mostramos el widget
  if (isLoading || insights.length === 0) {
    return null;
  }

  return (
    <div className="widget">
      <h2 className="widget-title">Análisis Inteligente 💡</h2>
      <ul className="insights-list">
        {insights.map((insight, index) => (
          <li key={index} className="insight-item">
            <div className="insight-icon">
              <CheckIcon />
            </div>
            <p className="insight-text">{insight}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}