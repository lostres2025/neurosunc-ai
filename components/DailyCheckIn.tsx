"use client";
// ...
import { API_BASE_URL } from '../app.config';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast'; // 1. IMPORTAMOS toast

const Slider = ({ label, value, onChange }: { label: string, value: number, onChange: (value: number) => void }) => (
  // ... (El componente Slider no cambia)
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
  // 2. ELIMINAMOS el useState de 'message'

  const handleSubmit = async () => {
    setIsLoading(true);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      toast.error('Usuario no autenticado.'); // <-- REEMPLAZO
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sleepHours, mood, fatigue }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('¡Check-in guardado!'); // <-- REEMPLAZO
      } else {
        toast.error(data.message || 'Ocurrió un error.'); // <-- REEMPLAZO
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
    return <div className="widget loading"><p>Cargando...</p></div>;
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
        disabled={isLoading || status !== 'authenticated'}
        className="widget-button"
      >
        {isLoading ? 'Guardando...' : 'Guardar Registro'}
      </button>

      {/* 3. ELIMINAMOS el div que mostraba el mensaje antiguo */}
    </div>
  );
}