"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="prediction-icon" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707.707M12 21v-1m0-10a4 4 0 00-4 4h8a4 4 0 00-4-4z" />
  </svg>
);

export default function PredictionAlert() {
  const { status } = useSession();
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Esperar a que la sesión cargue
    if (status === 'loading') return;
    
    // Si no está autenticado, no cargamos nada
    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    const fetchPrediction = async () => {
      try {
        // 2. Obtenemos los logs del usuario (Ruta segura, sin ID en URL)
        const response = await fetch('/api/dashboard');
        
        if (!response.ok) return; 

        const data = await response.json();
        
        // Obtenemos el último registro (el más reciente)
        // Nota: Asumimos que la API devuelve los logs ordenados, tomamos el último de la lista.
        const lastLog = data.dailyLogs?.[data.dailyLogs.length - 1]; 

        if (lastLog) {
          // 3. Enviamos ese log al motor de predicción
          const predictResponse = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lastLog),
          });

          if (predictResponse.status === 204) return; // No hay predicción
          
          if (predictResponse.ok) {
            const predictData = await predictResponse.json();
            setPrediction(predictData.prediction);
          }
        }
      } catch (error) {
        console.error("Error al obtener la predicción:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [status]);

  if (isLoading || !prediction) {
    return null;
  }

  return (
    <div className="prediction-alert animate-fade-in">
      <div className="prediction-icon-container">
        <LightbulbIcon />
      </div>
      <div className="prediction-text-container">
        <h4 className="prediction-title">Análisis del Día</h4>
        <p className="prediction-text">{prediction}</p>
      </div>
    </div>
  );
}