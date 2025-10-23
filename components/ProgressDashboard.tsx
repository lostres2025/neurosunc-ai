"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Definimos los tipos de datos que esperamos de la API
interface DailyLog {
  date: string;
  sleepHours: number;
  mood: number;
  fatigue: number;
}
interface GameSession {
  createdAt: string;
  score: number;
}

// Componente para mostrar un estado de carga
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export default function ProgressDashboard() {
  const { data: session, status } = useSession();

  const [data, setData] = useState<{ dailyLogs: DailyLog[], gameSessions: GameSession[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        
        const userId = (session?.user as any)?.id;
        
        if (!userId) {
          setError("No se pudo obtener el ID del usuario.");
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await fetch(`/api/dashboard?userId=${userId}`);
          if (!response.ok) throw new Error('No se pudieron cargar los datos del dashboard.');
          
          const fetchedData = await response.json();
          setData(fetchedData);

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

      fetchData();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
      setError("Necesitas iniciar sesión para ver tu progreso.");
    }
    
  }, [session, status]);

  // Formateamos los datos para que Recharts los entienda
  const formattedLogData = data?.dailyLogs.map(log => ({
    ...log,
    date: new Date(log.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
  })) || [];

  const formattedGameData = data?.gameSessions.map(session => ({
    ...session,
    date: new Date(session.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
  })) || [];


  if (isLoading || status === 'loading') return <LoadingSpinner />;
  if (error) return <p className="text-red-400 text-center h-48 flex items-center justify-center">{error}</p>;
  if (!data || (data.dailyLogs.length === 0 && data.gameSessions.length === 0)) {
    return <p className="text-slate-500 text-center h-48 flex items-center justify-center">No hay suficientes datos para mostrar gráficos. ¡Sigue registrando y jugando!</p>;
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      {/* Gráfico 1: Evolución del Sueño y Estado de Ánimo */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-white">Evolución de Hábitos</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedLogData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="date" stroke="#A0AEC0" />
            <YAxis stroke="#A0AEC0" />
            <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
            <Legend />
            <Line type="monotone" dataKey="sleepHours" name="Horas de Sueño" stroke="#4299E1" strokeWidth={2} />
            <Line type="monotone" dataKey="mood" name="Ánimo" stroke="#48BB78" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Gráfico 2: Puntuaciones en Juegos */}
      <div className="bg-slate-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-white">Rendimiento en Juegos</h3>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedGameData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="date" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" />
                <Tooltip contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #4A5568' }} />
                <Legend />
                <Bar dataKey="score" name="Puntuación" fill="#4299E1" />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}