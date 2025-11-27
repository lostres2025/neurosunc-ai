"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type GameState = 'start' | 'playing' | 'finished';
type Rule = 'COLOR' | 'SHAPE';
type Shape = 'circle' | 'square';
type Color = 'red' | 'blue';

interface Card {
  shape: Shape;
  color: Color;
}

export default function FlexibilityShiftGame() {
  const router = useRouter();
  const { status } = useSession();

  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentCard, setCurrentCard] = useState<Card>({ shape: 'circle', color: 'red' });
  const [currentRule, setCurrentRule] = useState<Rule>('COLOR');
  const [feedbackFromAI, setFeedbackFromAI] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateRound = useCallback(() => {
    const newShape: Shape = Math.random() > 0.5 ? 'circle' : 'square';
    const newColor: Color = Math.random() > 0.5 ? 'red' : 'blue';
    const newRule: Rule = Math.random() > 0.7 ? (currentRule === 'COLOR' ? 'SHAPE' : 'COLOR') : currentRule;

    setCurrentCard({ shape: newShape, color: newColor });
    setCurrentRule(newRule);
  }, [currentRule]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30)
    setFeedbackFromAI(null);
    setGameState('playing');
    generateRound();
  };

  const handleInput = (type: 'left' | 'right') => {
    if (gameState !== 'playing') return;

    let isCorrect = false;

    // LÓGICA:
    // Izquierda = Rojo / Círculo
    // Derecha = Azul / Cuadrado

    if (currentRule === 'COLOR') {
      if (type === 'left' && currentCard.color === 'red') isCorrect = true;
      if (type === 'right' && currentCard.color === 'blue') isCorrect = true;
    } else {
      if (type === 'left' && currentCard.shape === 'circle') isCorrect = true;
      if (type === 'right' && currentCard.shape === 'square') isCorrect = true;
    }

    if (isCorrect) {
      setScore(s => s + 15);
    } else {
      setScore(s => Math.max(0, s - 5));
    }
    generateRound();
  };

  const fetchAIFeedback = useCallback(async (finalScore: number) => {
    try {
      const response = await fetch('/api/games/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType: 'FLEXIBILITY_SHIFT', score: finalScore, level: 1 }),
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbackFromAI(data.feedback);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const saveGame = async () => {
    if (status !== 'authenticated') {
      toast.error("Inicia sesión para guardar.");
      router.push('/login');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/games/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'FLEXIBILITY_SHIFT', 
          score, 
          level: 1, 
          durationSeconds: 30
        }),
      });
      if (!response.ok) throw new Error("Error al guardar");
      toast.success("¡Partida guardada!");
      router.push('/dashboard');
    } catch (error) {
      toast.error("Error al guardar.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState('finished');
      fetchAIFeedback(score);
    }
  }, [timeLeft, gameState, score, fetchAIFeedback]);

  // --- RENDERIZADO CON CLASES CSS LIMPIAS ---
  return (
    <main className="game-page">
      
      {/* BARRA SUPERIOR */}
      <div className="game-status-bar flexibility">
        <p>Puntos: <span className="game-status-value green">{score}</span></p>
        <p>Tiempo: <span className="game-status-value yellow">{timeLeft}s</span></p>
      </div>

      <div className="game-board-container flexibility-container">
        
        {/* PANTALLA DE INICIO */}
        {gameState === 'start' && (
          <div className="game-overlay">
            <h2 className="game-title flexibility">Cambio de Regla 🔀</h2>
            <p style={{marginBottom: '1rem', color: '#cbd5e1'}}>
              Clasifica la figura central según la regla que aparezca arriba.
            </p>
            <div className="flexibility-instructions">
              <p>🔴 <strong>Si dice COLOR:</strong> Clasifica por Rojo o Azul.</p>
              <p>🔲 <strong>Si dice FORMA:</strong> Clasifica por Círculo o Cuadrado.</p>
            </div>
            <button onClick={startGame} className="game-button primary">¡Comenzar!</button>
          </div>
        )}

        {/* PANTALLA DE JUEGO */}
        {gameState === 'playing' && (
          <div className="flexibility-game-area">
            
            {/* INDICADOR DE REGLA */}
            <div className="rule-indicator-box">
              <p className="rule-label">REGLA ACTUAL</p>
              <div className={`rule-value ${currentRule.toLowerCase()}`}>
                {currentRule === 'COLOR' ? '🎨 POR COLOR' : '📐 POR FORMA'}
              </div>
            </div>

            {/* CARTA CENTRAL */}
            <div className="card-display-area">
              <div 
                className={`game-card ${currentCard.color} ${currentCard.shape}`}
              />
            </div>

            {/* BOTONES DE RESPUESTA */}
            <div className="flexibility-controls">
              <button onClick={() => handleInput('left')} className="flexibility-btn left">
                <span className="btn-label">Rojo / Círculo</span>
                <div className="btn-icons">
                  <div className="mini-shape circle red"></div>
                </div>
              </button>

              <button onClick={() => handleInput('right')} className="flexibility-btn right">
                <span className="btn-label">Azul / Cuadrado</span>
                <div className="btn-icons">
                  <div className="mini-shape square blue"></div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* PANTALLA FINAL */}
        {gameState === 'finished' && (
          <div className="game-overlay">
            <h2 className="game-finished-title">¡Tiempo! ⏱️</h2>
            <div className="game-final-score-box">
              <p>Puntuación Final</p>
              <span>{score}</span>
            </div>
            
            <div className="ai-feedback-box">
              <h3 className="ai-feedback-title">Análisis del Coach</h3>
              {feedbackFromAI ? (
                <p className="ai-feedback-text">{feedbackFromAI}</p>
              ) : (
                <p className="ai-feedback-text loading">Analizando...</p>
              )}
            </div>

            <div className="flexibility-finished-buttons">
              <button onClick={saveGame} disabled={isLoading} className="game-button success">
                {isLoading ? 'Guardando...' : 'Guardar y Salir'}
              </button>
              <button onClick={startGame} disabled={isLoading} className="game-button primary">
                Jugar de Nuevo
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}