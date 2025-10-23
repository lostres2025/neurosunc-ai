"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const LightbulbIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707.707M12 21v-1m0-10a4 4 0 00-4 4h8a4 4 0 00-4-4z" />
  </svg>
);

export default function PredictionAlert() {
  const { data: session, status } = useSession();
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchPrediction = async () => {
        const userId = (session?.user as any)?.id;
        if (!userId) {
          setIsLoading(false);
          return;
        }
        try {
          const response = await fetch(`/api/dashboard?userId=${userId}`);
          if (!response.ok) return;
          const data = await response.json();
          const lastLog = data.dailyLogs?.[data.dailyLogs.length - 1]; 
          if (lastLog) {
            const predictResponse = await fetch('/api/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lastLog),
            });
            if (predictResponse.status === 204) return;
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
    } else {
      setIsLoading(false);
    }
  }, [session, status]);

  if (isLoading || !prediction) {
    return null; // No renderizar nada si está cargando o no hay predicción
  }

  return (
    <div className="prediction-alert">
      <div className="prediction-icon">
        <LightbulbIcon />
      </div>
      <div className="prediction-text-container">
        <h4 className="prediction-title">Análisis del Día</h4>
        <p className="prediction-text">{prediction}</p>
      </div>
    </div>
  );
}