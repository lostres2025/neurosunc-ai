"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// El componente Slider se mantiene igual
const Slider = ({ label, value, onChange }: { label: string, value: number, onChange: (value: number) => void }) => (
  <div className="slider-wrapper">
    <div className="slider-labels">
      <label className="slider-label-text">{label}</label>
      <span className="slider-value">{value}</span>
    </div>
    <input
      type="range"
      min={label.includes("Sueño") ? 0 : 1}
      max={label.includes("Sueño") ? 12 : 5}
      step={label.includes("Sueño") ? 0.5 : 1}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="slider-input"
    />
  </div>
);

export default function DailyCheckIn() {
  const { data: session, status } = useSession(); 
  const [sleepHours, setSleepHours] = useState(7.5);
  const [mood, setMood] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // 1. Validación previa básica
    if (status !== 'authenticated') {
      toast.error('Debes iniciar sesión para guardar.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. CAMBIO IMPORTANTE: Usamos ruta relativa "/api/logs"
      // No enviamos userId en el body, la API lo saca de la cookie segura.
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          // userId, <--- YA NO SE ENVÍA. Es inseguro y redundante.
          sleepHours, 
          mood, 
          fatigue 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Check-in guardado correctamente!');
      } else {
        // Si la API devuelve error, lo mostramos
        toast.error(data.message || 'Error al guardar.');
      }

    } catch (error) {
      console.error("Error en Check-in:", error);
      toast.error('Error de conexión con el servidor.');
      
    } finally {
      // 3. CAMBIO CRÍTICO: Esto se ejecuta SIEMPRE (éxito o error)
      // Esto arregla que se quede "Cargando..." infinitamente.
      setIsLoading(false);
    }
  };
  
  if (status === "loading") {
    return <div className="widget loading"><p>Cargando panel...</p></div>;
  }

  return (
    <div className="widget">
      <h2 className="widget-title">Check-in Diario</h2>
      <div className="sliders-container">
        <Slider label="Horas de Sueño" value={sleepHours} onChange={setSleepHours} />
        <Slider label="Estado de Ánimo (1=Mal, 5=Genial)" value={mood} onChange={setMood} />
        <Slider label="Nivel de Fatiga (1=Agotado, 5=Enérgico)" value={fatigue} onChange={setFatigue} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="widget-button"
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >
        {isLoading ? 'Guardando...' : 'Guardar Registro'}
      </button>
    </div>
  );
}