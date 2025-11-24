'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';

export default function PatientCharts({ logs, sessions }: { logs: any[], sessions: any[] }) {
  
  // 1. PREPARAR DATOS DE BIENESTAR
  const healthData = logs.map(log => ({
    date: new Date(log.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
    fatigue: log.fatigue,
    mood: log.mood,
    sleep: log.sleepHours
  })).reverse(); 

  // 2. PREPARAR DATOS DE JUEGOS (SEPARADOS)
  
  // A) Filtramos solo los de Memoria
  const memoryData = sessions
    .filter(session => session.gameType === 'MEMORY_WORK') // Asegúrate que este sea el ID exacto en tu BD
    .map(session => ({
      date: new Date(session.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      score: session.score,
      level: session.level
    }))
    .slice(0, 10) // Últimas 10 partidas
    .reverse();

  // B) Filtramos solo los de Stroop (Atención)
  const stroopData = sessions
    .filter(session => session.gameType === 'ATTENTION_STROOP') // ID exacto en tu BD
    .map(session => ({
      date: new Date(session.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' }),
      score: session.score,
      level: session.level
    }))
    .slice(0, 10)
    .reverse();

  return (
    <div className="admin-grid">
      
      {/* --- GRÁFICO 1: BIENESTAR --- */}
      {/* Lo hacemos ancho completo (span 2) si hay espacio, para darle prioridad */}
      <div className="admin-card" style={{ gridColumn: '1 / -1', minHeight: '400px' }}>
        <p className="admin-card-title">🩺 Historial de Bienestar (Sueño, Ánimo, Fatiga)</p>
        <div style={{ width: '100%', height: '300px' }}>
          {healthData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} domain={[0, 'auto']} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="sleep" name="Sueño (hrs)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="mood" name="Ánimo (1-5)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="fatigue" name="Fatiga (1-5)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', marginTop: '100px', color: '#94a3b8' }}>Sin registros de bienestar aún.</p>
          )}
        </div>
      </div>

      {/* --- GRÁFICO 2: MEMORIA --- */}
      <div className="admin-card" style={{ minHeight: '400px' }}>
        <p className="admin-card-title">🧠 Memoria de Trabajo</p>
        <div style={{ width: '100%', height: '300px' }}>
          {memoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="score" name="Puntaje" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                {/* Nota: Si el nivel es muy bajo comparado al puntaje, a veces es mejor quitarlo o usar otro eje, pero dejémoslo por ahora */}
                <Bar dataKey="level" name="Nivel Alcanzado" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <span style={{ fontSize: '2rem' }}>🧩</span>
              <p>No ha jugado Memoria aún</p>
            </div>
          )}
        </div>
      </div>

      {/* --- GRÁFICO 3: ATENCIÓN (STROOP) --- */}
      <div className="admin-card" style={{ minHeight: '400px' }}>
        <p className="admin-card-title">⚡ Atención Selectiva (Stroop)</p>
        <div style={{ width: '100%', height: '300px' }}>
          {stroopData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stroopData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" style={{ fontSize: '12px' }} />
                <YAxis style={{ fontSize: '12px' }} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend />
                <Bar dataKey="score" name="Puntaje" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="level" name="Nivel Alcanzado" fill="#fcd34d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
              <span style={{ fontSize: '2rem' }}>⚡</span>
              <p>No ha jugado Stroop aún</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}