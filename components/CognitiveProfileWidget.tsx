"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

// Componente para el estado de carga
const LoadingState = () => (
  <div className="widget">
    <h2 className="widget-title">Perfil Cognitivo</h2>
    <div className="flex justify-center items-center h-48">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  </div>
);

// Componente para cuando no hay suficientes datos
const EmptyState = () => (
    <div className="widget">
        <h2 className="widget-title">Perfil Cognitivo</h2>
        <div className="text-center text-slate-400 py-10">
            <p>Aún no hay suficientes datos para generar tu perfil.</p>
            <p className="text-sm mt-2">¡Sigue registrando tus hábitos y jugando para desbloquearlo!</p>
        </div>
    </div>
);

export default function CognitiveProfileWidget() {
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<any>(null); // Usamos 'any' por simplicidad
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchProfile = async () => {
        const userId = (session.user as any)?.id;
        if (!userId) return;

        try {
          const response = await fetch(`/api/cognitive-profile?userId=${userId}`);
          if (response.ok) {
            const data = await response.json();
            setProfileData(data);
          } else {
            // Si el error es 404, significa que no hay datos, lo cual es normal.
            if(response.status !== 404) {
              console.error("Error al cargar el perfil:", await response.text());
            }
            setProfileData(null); // Aseguramos que no hay datos
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
      fetchProfile();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [session, status]);

  if (isLoading || status === 'loading') {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Lado del Gráfico */}
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" stroke="#94a3b8" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="none" />
              <Radar name="Tu Perfil" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        {/* Lado del Resumen de la IA */}
        <div className="ai-summary-box">
          <h3 className="ai-summary-title">Análisis del Coach</h3>
           <div className="prose prose-invert">
                <ReactMarkdown>{profileData.summary}</ReactMarkdown>
                </div>
        </div>
      </div>
    </div>
  );
}
