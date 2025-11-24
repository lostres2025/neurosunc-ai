"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const toastId = toast.loading('Iniciando sesión...');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      toast.dismiss(toastId);

      if (result && !result.error) {
        toast.success('¡Bienvenido!');
        
        // --- CAMBIO CLAVE AQUÍ ---
        // Usamos window.location para forzar una recarga limpia.
        // Esto enviará al usuario a "/" (Home).
        // Tu archivo app/page.tsx detectará que es ADMIN y lo redirigirá a /admin.
        window.location.href = '/';
        // -------------------------

      } else {
        toast.error('Credenciales inválidas. Inténtalo de nuevo.');
        setIsLoading(false);
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('Ocurrió un error inesperado de conexión.');
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Iniciar Sesión</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="auth-input"
          />
          <input 
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="auth-input"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="auth-button"
          >
            {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
        <div className="auth-link-container">
          <Link href="/register" className="auth-link">
            ¿No tienes una cuenta? Regístrate
          </Link>
        </div>
      </div>
    </main>
  );
}