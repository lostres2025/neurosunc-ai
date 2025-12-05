"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Componente Slider interno con clases específicas
const SmartSlider = ({ label, value, onChange, min = 1, max = 5, step = 1 }: any) => (
  <div className="smart-slider-wrapper">
    <div className="smart-slider-labels">
      <label>{label}</label>
      <span className="smart-slider-value">{value}</span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="smart-slider-input"
    />
  </div>
);

export default function SmartDailyCheckIn() {
  const { status } = useSession();
  
  const [step, setStep] = useState<'questions' | 'review'>('questions');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Respuestas de texto
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  // Valores numéricos (Estados)
  const [sleepHours, setSleepHours] = useState(7);
  const [mood, setMood] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [aiReason, setAiReason] = useState("");

  const handleAnalyze = async () => {
    if (!q1 || !q2 || !q3) {
      toast.error("Por favor responde las 3 preguntas.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: { q1, q2, q3 } }),
      });

      const data = await response.json();
      
      setMood(data.mood || 3);
      setFatigue(data.fatigue || 3);
      setSleepHours(data.sleep || 7);
      setAiReason(data.reason || "");
      
      setStep('review');
      toast.success("¡Análisis completado!");

    } catch (error) {
      toast.error("Error de IA. Ajusta manualmente.");
      setStep('review');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sleepHours, mood, fatigue }),
      });

      if (response.ok) {
        toast.success('¡Registro guardado!');
        setQ1(""); setQ2(""); setQ3(""); 
        setStep('questions');
      } else {
        toast.error('Error al guardar.');
      }
    } catch (error) {
      toast.error('Error de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') return <div className="smart-checkin-widget loading"><p>Cargando...</p></div>;

  return (
    <div className="smart-checkin-widget">
      <h2 className="smart-checkin-title">
        Check-in Diario {step === 'questions' ? '💬' : '📊'}
      </h2>

      {step === 'questions' ? (
        // --- FASE 1: PREGUNTAS ---
        <div className="smart-checkin-form">
          <p className="smart-checkin-subtitle">
            Responde brevemente para que la IA evalúe tu estado.
          </p>
          
          <div className="smart-input-group">
            <label>1. ¿Cómo dormiste anoche?</label>
            <input 
              type="text" 
              value={q1} onChange={(e) => setQ1(e.target.value)}
              placeholder="Ej: Mal, desperté mucho..."
              className="smart-text-input"
            />
          </div>

          <div className="smart-input-group">
            <label>2. ¿Cómo te sientes emocionalmente?</label>
            <input 
              type="text" 
              value={q2} onChange={(e) => setQ2(e.target.value)}
              placeholder="Ej: Un poco ansioso pero bien."
              className="smart-text-input"
            />
          </div>

          <div className="smart-input-group">
            <label>3. ¿Cómo está tu energía física?</label>
            <input 
              type="text" 
              value={q3} onChange={(e) => setQ3(e.target.value)}
              placeholder="Ej: Me siento con pilas."
              className="smart-text-input"
            />
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            className="smart-action-button analyze"
          >
            {isAnalyzing ? 'Analizando con IA...' : '✨ Generar Métricas'}
          </button>
        </div>
      ) : (
        // --- FASE 2: REVISIÓN Y SLIDERS ---
        <div className="smart-checkin-review">
          
          <div className="smart-ai-feedback-box">
            <p>🤖 IA: "{aiReason || "Aquí tienes mi sugerencia basada en tus respuestas."}"</p>
          </div>

          <SmartSlider label="Horas de Sueño" value={sleepHours} onChange={setSleepHours} min={0} max={12} step={0.5} />
          <SmartSlider label="Estado de Ánimo (1-5)" value={mood} onChange={setMood} />
          <SmartSlider label="Nivel de Energía (1-5)" value={fatigue} onChange={setFatigue} />

          <div className="smart-button-group">
            <button 
              onClick={() => setStep('questions')}
              className="smart-action-button secondary"
            >
              ← Volver
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="smart-action-button primary"
            >
              {isSaving ? 'Guardando...' : '💾 Confirmar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}