import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) redirect('/api/auth/signin');
  // Ajusta esto según cómo tengas tus tipos. Si te da error "role", usa (session.user as any).role
  if ((session.user as any).role !== 'ADMIN') redirect('/');

  return (
    // Usamos la clase .admin-layout que definimos en CSS
    <div className="admin-layout">
      
      {/* Sidebar con clase CSS */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          NeuroSync Admin
        </div>
        
        <nav className="admin-nav">
          <Link href="/admin" className="admin-nav-link">
            📊 Dashboard
          </Link>

          <Link href="/admin/patients" className="admin-nav-link">
             👥 Pacientes
          </Link>
          
          <Link href="/" className="admin-nav-link" style={{ marginTop: 'auto' }}>
             📱 Volver a la App
          </Link>
        </nav>
      </aside>

      {/* Contenido Principal con clase CSS */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}