"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { API_BASE_URL } from '../app.config';

const CheckIcon = () => (
  <svg className="insight-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);

export default function InsightsWidget() {
  const { data: session, status } = useSession();
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    const fetchInsights = async () => {
      const userId = (session.user as any)?.id;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/insights?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          // Solo actualizamos si 'insights' es un array
          if (Array.isArray(data.insights)) {
            setInsights(data.insights);
          }
        }
      } catch (error) {
        console.error("Error fetching insights:", error);
      } finally {
        // --- CORRECCIÓN CLAVE ---
        // Este bloque se ejecuta siempre y detiene la carga.
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [session, status]);

  // Si está cargando, o si después de cargar no hay insights, no mostramos nada.
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