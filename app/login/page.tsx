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
    toast.loading('Iniciando sesión...'); // Toast de carga
    console.log(`[FRONTEND] 1. Intentando iniciar sesión para: ${email}`);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log("[FRONTEND] 2. Respuesta recibida de NextAuth:", result);

      if (result && !result.error) {
        console.log("[FRONTEND] 3. Login exitoso. Redirigiendo a /dashboard...");
        toast.dismiss(); // Cierra el toast de carga
        toast.success('¡Bienvenido!');
        router.push('/dashboard');
      } else {
        console.error("[FRONTEND] 4. Error en el login:", result?.error);
        toast.dismiss();
        toast.error('Credenciales inválidas o error en el servidor.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error("[FRONTEND] 5. Error catastrófico en el fetch:", error);
      toast.dismiss();
      toast.error('No se pudo conectar con el servidor.');
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page">
      {/* ... (el resto de tu HTML del formulario no cambia) ... */}
    </main>
  );
}