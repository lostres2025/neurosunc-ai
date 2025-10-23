"use client";
import { API_BASE_URL } from '../app.config';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const CheckIcon = () => (
  // El icono SVG no cambia
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default function InsightsWidget() {
  const { data: session, status } = useSession();
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchInsights = async () => {
        const userId = (session.user as any)?.id;
        if (!userId) { setIsLoading(false); return; }
        try {
          const response = await fetch(`${API_BASE_URL}/api/insights?userId=${userId}`);;
          const data = await response.json();
          if (response.ok) {
            setInsights(data.insights);
          }
        } catch (error: unknown) { // Especificamos el tipo 'unknown'
            if (error instanceof Error) {
               console.error("...", error.message);
                // Si tienes un setError, sería: setError(error.message);
           } else {
              console.error("...", "Un error desconocido ocurrió");
           // setError("Un error desconocido ocurrió");
         }
        }
      };
      fetchInsights();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  // No mostrar nada si está cargando o si no hay insights que mostrar
  if (isLoading || insights.length === 0) {
    return null;
  }

  return (
    <div className="widget">
      <h2 className="widget-title">Análisis Inteligente</h2>
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