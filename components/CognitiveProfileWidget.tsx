"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

// Componente para el estado de carga
const LoadingState = () => (
  <div className="widget">
    <h2 className="widget-title">Perfil Cognitivo</h2>
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  </div>
);

// Componente para cuando no hay suficientes datos
const EmptyState = () => (
    <div className="widget">
        <h2 className="widget-title">Perfil Cognitivo</h2>
        <div className="empty-state-container">
            <p>Aún no hay suficientes datos para generar tu perfil.</p>
            <p className="empty-state-subtitle">¡Sigue registrando tus hábitos y jugando para desbloquearlo!</p>
        </div>
    </div>
);

export default function CognitiveProfileWidget() {
  const { status } = useSession();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Esperar a que cargue la sesión
    if (status === 'loading') return;

    if (status !== 'authenticated') {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // 2. CAMBIO CLAVE: Llamada segura sin ID en la URL
        // La API debe leer la cookie de sesión para saber quién es el usuario
        const response = await fetch('/api/cognitive-profile');
        
        if (!response.ok) {
          setProfileData(null);
          return;
        }
        
        const data = await response.json();
        setProfileData(data);

      } catch (error) {
        console.error("Error de red al cargar el perfil:", error);
        setProfileData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [status]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (!profileData || !profileData.scores) {
    return <EmptyState />;
  }

  // Preparamos los datos para el gráfico de radar
  const chartData = [
    { subject: 'Memoria', score: profileData.scores.memory, fullMark: 100 },
    { subject: 'Atención', score: profileData.scores.attention, fullMark: 100 },
    { subject: 'Bienestar', score: profileData.scores.wellness, fullMark: 100 },
  ];

  return (
    <div className="widget">
      <h2 className="widget-title">Tu Perfil Cognitivo</h2>
      <div className="profile-grid">
        {/* Lado del Gráfico */}
        <div className="radar-chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Tu Perfil" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Lado del Resumen de la IA */}
        <div className="ai-summary-box">
          <h3 className="ai-summary-title">Análisis del Coach</h3>
          <div className="prose text-sm text-slate-300">
            <ReactMarkdown>{profileData.summary}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}