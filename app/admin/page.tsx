import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic'; 

export default async function AdminDashboard() {
  const [totalPatients, totalGames, totalLogs, recentAlerts] = await Promise.all([
    prisma.user.count({ where: { role: 'USER' } }),
    prisma.gameSession.count(),
    prisma.dailyLog.count(),
    prisma.dailyLog.findMany({
      where: { fatigue: { gte: 4 } },
      include: { user: true },
      orderBy: { date: 'desc' },
      take: 5 
    })
  ]);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>
        Hola, Doc. 👋
      </h1>

      {/* Grid de Tarjetas */}
      <div className="admin-grid">
        
        {/* Card 1 */}
        <div className="admin-card">
          <p className="admin-card-title">Pacientes Totales</p>
          <p className="admin-card-value" style={{ color: '#4f46e5' }}>{totalPatients}</p>
        </div>

        {/* Card 2 */}
        <div className="admin-card">
          <p className="admin-card-title">Partidas Jugadas</p>
          <p className="admin-card-value" style={{ color: '#16a34a' }}>{totalGames}</p>
        </div>

        {/* Card 3 */}
        <div className="admin-card">
          <p className="admin-card-title">Registros de Salud</p>
          <p className="admin-card-value" style={{ color: '#2563eb' }}>{totalLogs}</p>
        </div>
      </div>

      {/* Sección de Alertas */}
      <div className="admin-table-container">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            ⚠️ Alertas de Fatiga Alta
          </h2>
        </div>
        
        <table className="admin-table">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Nivel Fatiga</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {recentAlerts.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>
                  No hay alertas recientes.
                </td>
              </tr>
            ) : (
              recentAlerts.map((log) => (
                <tr key={log.id}>
                  <td>{log.user.email}</td>
                  <td>
                    <span style={{ 
                      background: '#fee2e2', 
                      color: '#991b1b', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold' 
                    }}>
                      Nivel {log.fatigue}
                    </span>
                  </td>
                  <td>{new Date(log.date).toLocaleDateString()}</td>
                  <td>
                    <Link 
                      href={`/admin/patients/${log.userId}`}
                      style={{ color: '#4f46e5', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                      Ver Perfil
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}