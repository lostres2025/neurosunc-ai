"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type GameState = 'start' | 'playing' | 'finished';

const COLORS = [
  { name: 'Rojo', value: '#ef4444' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Amarillo', value: '#facc15' },
];

export default function AttentionStroopGame() {
  const router = useRouter();
  const { status } = useSession(); // Solo necesitamos el status para saber si cargó

  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackFromAI, setFeedbackFromAI] = useState<string | null>(null);

  // Opciones barajadas para que los botones cambien de lugar
  const shuffledOptions = useMemo(() => [...COLORS].sort(() => 0.5 - Math.random()), [currentWord]);

  // --- CONEXIÓN CON APIS ---

  const fetchAIFeedback = useCallback(async (gameType: string, finalScore: number, finalLevel: number) => {
    try {
      // Ruta relativa
      const response = await fetch('/api/games/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, score: finalScore, level: finalLevel }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedbackFromAI(data.feedback);
      }
    } catch (error) {
      console.error("Error AI Feedback:", error);
      setFeedbackFromAI("No se pudo obtener el análisis.");
    }
  }, []);

  const saveGame = async () => {
    if (status !== 'authenticated') {
      toast.error("Debes iniciar sesión para guardar.");
      router.push('/login');
      return;
    }

    setIsLoading(true);

    try {
      // CAMBIO CLAVE: Sin userId en el body, ruta relativa
      const response = await fetch('/api/games/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'ATTENTION_STROOP', 
          score, 
          level: 1, // Stroop suele ser nivel único o basado en velocidad
          durationSeconds: 30
        }),
      });

      if (!response.ok) throw new Error("Error al guardar");

      toast.success("¡Partida guardada!");
      router.push('/dashboard');

    } catch (error) {
      console.error("Error Save Game:", error);
      toast.error("Error al guardar la partida.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DE JUEGO ---

  const nextRound = useCallback(() => {
    let newWord, newColor;
    do {
      newWord = COLORS[Math.floor(Math.random() * COLORS.length)];
      newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    } while (newWord.name === newColor.name); // Evitamos que coincidan para mantener la dificultad
    
    setCurrentWord(newWord);
    setCurrentColor(newColor);
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setFeedbackFromAI(null);
    setGameState('playing');
    nextRound();
  };

  const handleAnswer = (selectedColorName: string) => {
    if (gameState !== 'playing') return;
    
    // La respuesta correcta es el COLOR de la tinta (currentColor), no la palabra escrita
    if (selectedColorName === currentColor.name) {
      setScore(prev => prev + 10);
    } else {
      setScore(prev => (prev > 0 ? prev - 5 : 0)); // Penalización por error
    }
    nextRound();
  };

  // --- TEMPORIZADOR ---
  
  useEffect(() => {
    if (gameState !== 'playing') return;

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Fin del tiempo
      setGameState('finished');
      fetchAIFeedback('ATTENTION_STROOP', score, 1);
    }
  }, [timeLeft, gameState, score, fetchAIFeedback]);


  // --- RENDERIZADO ---

  const renderGameContent = () => {
    switch (gameState) {
      case 'finished':
        return (
          <div className="game-overlay">
            <h2 className="game-finished-title">¡Tiempo! ⏱️</h2>
            
            <div className="game-final-score-box">
              <p>Puntuación Final</p>
              <span>{score}</span>
            </div>
            
            <div className="ai-feedback-box">
              <h3 className="ai-feedback-title">Análisis del Coach 🧠</h3>
              {feedbackFromAI ? (
                <p className="ai-feedback-text">{feedbackFromAI}</p>
              ) : (
                <p className="ai-feedback-text loading">Analizando tu agilidad mental...</p>
              )}
            </div>
            
            <div className="stroop-finished-buttons">
              <button 
                onClick={saveGame} 
                disabled={isLoading} 
                className="game-button success"
                style={{ opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? 'Guardando...' : 'Guardar y Salir'}
              </button>
              
              {!isLoading && (
                <button onClick={startGame} className="game-button primary">
                  Jugar de Nuevo
                </button>
              )}
            </div>
          </div>
        );

      case 'playing':
        return (
          <div className="stroop-playing-container">
            <p className="stroop-instruction">
              Selecciona el color de la <strong>TINTA</strong>
            </p>
            
            {/* Palabra Trampa */}
            <div className="stroop-word" style={{ color: currentColor.value, fontSize: '3rem', fontWeight: 'bold', margin: '2rem 0' }}>
              {currentWord.name}
            </div>
            
            {/* Opciones */}
            <div className="stroop-options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {shuffledOptions.map((color) => (
                <button 
                  key={color.name}
                  onClick={() => handleAnswer(color.name)}
                  className="stroop-option-button"
                  style={{ 
                    backgroundColor: color.value, 
                    height: '80px', 
                    borderRadius: '12px', 
                    border: 'none', 
                    cursor: 'pointer',
                    transition: 'transform 0.1s'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                />
              ))}
            </div>
          </div>
        );

      case 'start':
      default:
        return (
          <div className="game-overlay">
            <h2 className="game-title stroop">⚡ Test de Atención</h2>
            <p className="mb-6 text-center text-slate-300">
              Aparecerá una palabra. Tu objetivo es presionar el botón que coincida con el <strong>COLOR DE LA TINTA</strong>, ignorando lo que dice la palabra.
            </p>
            <p className="mb-8 font-bold text-indigo-300">¡Sé rápido! Tienes 60 segundos.</p>
            <button onClick={startGame} className="game-button primary">Empezar</button>
          </div>
        );
    }
  };

  return (
    <main className="game-page">
      <div className="game-status-bar stroop">
        <p>Puntos: <span className="game-status-value green">{score}</span></p>
        <p>Tiempo: <span className="game-status-value yellow">{timeLeft}s</span></p>
      </div>
      
      <div className="game-board-container stroop">
        {renderGameContent()}
      </div>
    </main>
  );
}