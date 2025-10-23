"use client";

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados para el cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Estados para la eliminación de cuenta
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error('Las nuevas contraseñas no coinciden.');
      return;
    }
    setIsChangingPassword(true);
    const userId = (session?.user as any)?.id;
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Error de conexión.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    const userId = (session?.user as any)?.id;
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: deletePassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        // Cerramos sesión y redirigimos
        await signOut({ redirect: false });
        router.push('/login');
      } else {
        toast.error(data.message);
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

  if (status === "loading") {
    return <div className="loading-screen">Cargando...</div>;
  }
  if (status === "unauthenticated") {
    router.push('/login');
    return null;
  }

  return (
    <>
      <main className="dashboard-page">
        <header className="dashboard-header">
          <Link href="/dashboard" className="back-to-dashboard">← Volver al Dashboard</Link>
        </header>

        <div className="settings-container">
          <h1 className="settings-title">Ajustes de la Cuenta</h1>

          <div className="widget">
            <h2 className="widget-title">Información del Perfil</h2>
            <div className="profile-info">
              <label>Correo Electrónico</label>
              <span>{session?.user?.email}</span>
            </div>
          </div>

          <div className="widget">
            <h2 className="widget-title">Cambiar Contraseña</h2>
            <form onSubmit={handleChangePassword} className="settings-form">
              <input type="password" placeholder="Contraseña Actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="settings-input" />
              <input type="password" placeholder="Nueva Contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="settings-input" />
              <input type="password" placeholder="Confirmar Nueva Contraseña" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="settings-input" />
              <button type="submit" disabled={isChangingPassword} className="widget-button">
                {isChangingPassword ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>

          <div className="widget danger-zone">
            <h2 className="widget-title">Zona de Peligro</h2>
            <p className="widget-text">Esta acción no se puede deshacer. Se eliminarán permanentemente tu cuenta y todos tus datos.</p>
            <button onClick={() => setShowDeleteModal(true)} className="danger-button">
              Eliminar mi Cuenta
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Confirmación para Eliminar Cuenta */}
      {showDeleteModal && (
        <div className="report-modal-backdrop">
          <div className="report-modal-content">
            <div className="report-modal-header">
              <h2>¿Estás seguro?</h2>
              <button onClick={() => setShowDeleteModal(false)}>&times;</button>
            </div>
            <div className="report-modal-body">
              <p>Esta acción es irreversible. Para confirmar, por favor escribe tu contraseña.</p>
              <form onSubmit={handleDeleteAccount} className="settings-form">
                <input type="password" placeholder="Escribe tu contraseña" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="settings-input" />
                <button type="submit" disabled={isDeleting} className="danger-button">
                  {isDeleting ? 'Eliminando...' : 'Eliminar Cuenta Permanentemente'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}