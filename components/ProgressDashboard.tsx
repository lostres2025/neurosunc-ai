"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DailyLog {
  date: string;
  sleepHours: number;
  mood: number;
  fatigue: number;
}
interface GameSession {
  createdAt: string;
  score: number;
  gameType: string; // Agregué el tipo de juego para el futuro
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-48">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

export default function ProgressDashboard() {
  const { data: session, status } = useSession();

  const [data, setData] = useState<{ dailyLogs: DailyLog[], gameSessions: GameSession[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solo intentamos cargar si está autenticado
    if (status === 'authenticated') {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
          // CAMBIO CLAVE: Usamos ruta relativa y NO enviamos userId.
          // La API lo sacará de la cookie de sesión automáticamente.
          const response = await fetch('/api/dashboard');
          
          if (!response.ok) {
            throw new Error('Error al cargar datos');
          }
          
          const fetchedData = await response.json();
          setData(fetchedData);

        } catch (error) {
          console.error("Dashboard Error:", error);
          setError("No se pudieron cargar tus datos.");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    } else if (status === 'unauthenticated') {
      // Si no hay sesión, paramos la carga
      setIsLoading(false);
    }
  }, [status]); // Solo dependemos del status

  // Formateo de datos
  const formattedLogData = data?.dailyLogs.map(log => ({
    ...log,
    // Formato corto de fecha (ej: "24 oct")
    date: new Date(log.date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
  })) || [];

  const formattedGameData = data?.gameSessions.map(session => ({
    ...session,
    date: new Date(session.createdAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
  })) || [];

  // Estados de carga y error
  if (status === 'loading' || isLoading) return <LoadingSpinner />;
  
  if (status === 'unauthenticated') return (
    <div className="bg-slate-800 p-8 rounded-lg text-center text-slate-400">
      Debes iniciar sesión para ver tu progreso.
    </div>
  );

  if (error) return (
    <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-200 text-center">
      {error}
    </div>
  );

  if (!data || (data.dailyLogs.length === 0 && data.gameSessions.length === 0)) {
    return (
      <div className="bg-slate-800 p-8 rounded-lg text-center">
        <p className="text-slate-300 text-lg mb-2">📉 Aún no hay datos</p>
        <p className="text-slate-500 text-sm">Completa tu Check-in diario o juega una partida para ver estadísticas.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
      
      {/* Gráfico 1: Evolución del Sueño y Ánimo */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
          🩺 Evolución de Hábitos
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedLogData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} 
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="sleepHours" name="Sueño (hrs)" stroke="#60a5fa" strokeWidth={3} dot={{r:4}} />
              <Line type="monotone" dataKey="mood" name="Ánimo (1-5)" stroke="#34d399" strokeWidth={3} dot={{r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Gráfico 2: Puntuaciones */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
          🎮 Rendimiento en Juegos
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedGameData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 12}} />
              <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#fff' }} 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="score" name="Puntuación" fill="#818cf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}