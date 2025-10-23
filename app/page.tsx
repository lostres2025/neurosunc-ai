"use client";

import Link from 'next/link';

const BrainIcon = () => (
  <div className="welcome-icon">
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5c2.4 0 4.5 2.1 4.5 4.5s-2.1 4.5-4.5 4.5S7.5 11.4 7.5 9 9.6 4.5 12 4.5zM12 13.5c-3.3 0-6 2.7-6 6h12c0-3.3-2.7-6-6-6zM15 9c0-1.7-1.3-3-3-3s-3 1.3-3 3 1.3 3 3 3 3-1.3 3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 11.5c-1.2 1.2-2 2.8-2 4.5M15.5 11.5c1.2 1.2 2 2.8 2 4.5" />
    </svg>
  </div>
);

export default function WelcomePage() {
  return (
    <main className="welcome-page">
      <div className="welcome-hero">
        <BrainIcon />
        <h1 className="welcome-title">NeuroSync AI</h1>
        <p className="welcome-slogan">
          Desbloquea tu potencial. Entiende y entrena tu mente con el poder de la IA.
        </p>
      </div>
      <div className="welcome-actions">
        <Link href="/register" className="welcome-button-primary">
          Comenzar Ahora
        </Link>
        <Link href="/login" className="welcome-link-secondary">
          ¿Ya tienes una cuenta? Inicia sesión
        </Link>
      </div>
    </main>
  );
}