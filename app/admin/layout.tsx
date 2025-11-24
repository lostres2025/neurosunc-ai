import { auth, signOut } from '@/auth'; // <--- IMPORTANTE: Importamos signOut
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect('/api/auth/signin');
  if ((session.user as any).role !== 'ADMIN') redirect('/');

  return (
    // Estilos CSS puros para el layout
    <div 
      className="admin-layout"
      style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}
    >
      
      {/* Sidebar */}
      <aside 
        className="admin-sidebar" 
        style={{ width: '260px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}
      >
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4f46e5', marginBottom: '2rem' }}>
          NeuroSync Admin
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <Link 
            href="/admin" 
            style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', color: '#475569', textDecoration: 'none', fontWeight: '500' }}
          >
            📊 Dashboard
          </Link>

          <Link 
            href="/admin/patients" 
            style={{ display: 'block', padding: '0.75rem 1rem', borderRadius: '8px', color: '#475569', textDecoration: 'none', fontWeight: '500' }}
          >
             👥 Pacientes
          </Link>
        </nav>

        {/* --- AQUÍ ESTÁ EL CAMBIO IMPORTANTE --- */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
          
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
            Sesión iniciada como:<br/>
            <strong>{session.user.email}</strong>
          </div>

          {/* Botón de Cerrar Sesión (Server Action) */}
          <form
            action={async () => {
              "use server";
              // Esto borra la cookie y te manda al inicio
              await signOut({ redirectTo: "/" });
            }}
          >
            <button 
              type="submit" 
              style={{ 
                width: '100%', padding: '0.75rem', backgroundColor: '#fee2e2', 
                color: '#991b1b', border: 'none', borderRadius: '8px', 
                fontWeight: 'bold', cursor: 'pointer', textAlign: 'center'
              }}
            >
              🚪 Cerrar Sesión
            </button>
          </form>

        </div>
        {/* ------------------------------------- */}

      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}