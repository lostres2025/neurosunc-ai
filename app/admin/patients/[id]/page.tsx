import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PatientCharts from './charts'; // Importamos el componente de arriba

interface PageProps {
  params: { id: string }
}

export default async function PatientDetailPage({ params }: PageProps) {
  // 1. Buscamos al paciente por su ID
  const patient = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      logs: {
        orderBy: { date: 'desc' },
        take: 7 // Traemos los últimos 7 días de registros
      },
      sessions: {
        orderBy: { createdAt: 'desc' },
        take: 20 // Traemos las últimas 20 partidas
      }
    }
  });

  // Si no existe el usuario (o pone un ID falso), mostramos error 404
  if (!patient) {
    notFound();
  }

  return (
    <div>
      {/* Botón Volver */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link 
          href="/admin/patients" 
          style={{ textDecoration: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}
        >
          ← Volver a la lista
        </Link>
      </div>

      {/* Encabezado del Perfil */}
      <div style={{ 
        background: 'white', padding: '2rem', borderRadius: '12px', 
        border: '1px solid #e2e8f0', marginBottom: '2rem', display: 'flex', 
        justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '64px', height: '64px', background: '#e0e7ff', borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: '1.5rem', fontWeight: 'bold', color: '#4338ca' 
          }}>
            {patient.email[0].toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              {patient.email}
            </h1>
            <p style={{ color: '#64748b', margin: '0.25rem 0 0 0' }}>
              Paciente desde: {new Date(patient.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Partidas</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{patient.sessions.length}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Registros</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{patient.logs.length}</p>
          </div>
        </div>
      </div>

      {/* Título de Sección */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>
        Análisis Gráfico
      </h2>

      {/* Aquí insertamos los gráficos (Componente Cliente) */}
      <PatientCharts logs={patient.logs} sessions={patient.sessions} />

    </div>
  );
}