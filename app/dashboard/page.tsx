"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DailyCheckIn from '../../components/DailyCheckIn';
import PredictionAlert from '../../components/PredictionAlert';
import InsightsWidget from '../../components/InsightsWidget';
import CognitiveProfileWidget from '../../components/CognitiveProfileWidget';
import DailyContentWidget from '@/components/DailyContentWidget';
import SmartDailyCheckIn from '@/components/SmartDailyCheckIn';
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  if (status === "loading") {
    return <div className="loading-screen">Cargando...</div>;
  }
  if (status === "unauthenticated") {
    router.push('/login');
    return null;
  }

  return (
    <main className="dashboard-page">
    <header className="dashboard-header">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="dashboard-title">
            Bienvenido,
            </h1>
            <p className="dashboard-subtitle">{session?.user?.email}</p>
          </div>
          <Link href="/settings" aria-label="Ajustes de la cuenta" className="settings-icon-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>
        </div>
        <button 
          onClick={handleLogout}
          className="dashboard-logout-button"
        >
          Cerrar Sesión
        </button>
      </header>
      
      <div className="dashboard-widgets-container">
        <PredictionAlert />
        <InsightsWidget />
        <DailyContentWidget/>
        <SmartDailyCheckIn/>
        
        
        
        <div className="widget lg-col-span-2">
          <h2 className="widget-title">Entrenamiento de Hoy</h2>
          <p className="widget-text">
            Selecciona un ejercicio para fortalecer tu mente.
          </p>
          <div className="game-buttons-container">
              <Link 
                href="/play/memory-work" 
                className="widget-button-game"
              >
                Memoria de Trabajo 🧠
              </Link>
              <Link 
                href="/play/attention-stroop" 
                className="widget-button-game"
              >
                Atención Selectiva ⚡
              </Link>
               <Link 
                href="/play/flexibility-shift" 
                className="widget-button-game"
              >
                Flexibilidad Cognitiva 🔀
              </Link>
          </div>
        </div>

        <div className="lg-col-span-3">
          <CognitiveProfileWidget />
        </div>
        
      </div>
    </main>
  );
}