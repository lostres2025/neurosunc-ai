import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PatientsPage() {
  // 1. Obtener pacientes de la BD (Solo los que tienen rol USER)
  const patients = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { createdAt: 'desc' }, // Los más nuevos primero
    include: {
      _count: {
            select: { sessions: true, logs: true } // 
      }
    }
  });

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
            Mis Pacientes
          </h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            Gestión y seguimiento clínico de usuarios registrados.
          </p>
        </div>
        <div style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold' }}>
          Total: {patients.length}
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario / Email</th>
              <th>Fecha Registro</th>
              <th style={{ textAlign: 'center' }}>Partidas Jugadas</th>
              <th style={{ textAlign: 'center' }}>Check-ins Diarios</th>
              <th style={{ textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  No hay pacientes registrados aún.
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr key={patient.id}>
                  {/* Columna Email */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ 
                        width: '32px', height: '32px', background: '#e2e8f0', 
                        borderRadius: '50%', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', fontWeight: 'bold', color: '#64748b', fontSize: '0.8rem'
                      }}>
                        {patient.email[0].toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '500', color: '#334155' }}>
                        {patient.email}
                      </span>
                    </div>
                  </td>

                  {/* Columna Fecha */}
                  <td style={{ color: '#64748b' }}>
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </td>

                  {/* Métricas */}
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      background: '#f0fdf4', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600'
                    }}>
                      {patient._count.sessions}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ 
                      background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600'
                    }}>
                      {patient._count.logs}
                    </span>
                  </td>

                  {/* Botón de Acción */}
                  <td style={{ textAlign: 'right' }}>
                    <Link 
                      href={`/admin/patients/${patient.id}`}
                      style={{ 
                        textDecoration: 'none', color: '#4f46e5', fontWeight: 'bold', 
                        fontSize: '0.9rem', border: '1px solid #e0e7ff', padding: '6px 12px',
                        borderRadius: '6px', transition: 'background 0.2s'
                      }}
                    >
                      Ver Progreso &rarr;
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