"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type GameState = 'start' | 'showing' | 'playing' | 'finished';

export default function MemoryWorkGame() {
  const router = useRouter();
  const { status } = useSession(); // Solo necesitamos el status
  
  const [gameState, setGameState] = useState<GameState>('start');
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [score, setScore] = useState(0);
  const [activeTile, setActiveTile] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackFromAI, setFeedbackFromAI] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const gridSize = 9;

  // --- LÓGICA DE JUEGO ---

  const prepareLevel = (currentLevel: number) => {
    setPlayerSequence([]);
    setFeedback(null);
    setActiveTile(null);
    setFeedbackFromAI(null);
    
    if (currentLevel === 1) {
      setStartTime(Date.now());
    }

    const newSequence = [];
    for (let i = 0; i < currentLevel + 2; i++) {
      newSequence.push(Math.floor(Math.random() * gridSize));
    }
    setSequence(newSequence);
    setGameState('showing');
  };

  const startGame = () => {
    setLevel(1);
    setScore(0);
    prepareLevel(1);
  };

  const handleTileClick = (tileIndex: number) => {
    if (gameState !== 'playing') return;
    setActiveTile(tileIndex);
    setTimeout(() => setActiveTile(null), 200);

    const newPlayerSequence = [...playerSequence, tileIndex];
    setPlayerSequence(newPlayerSequence);
    
    // Error
    if (sequence[newPlayerSequence.length - 1] !== tileIndex) {
      setFeedback('incorrect');
      fetchAIFeedback('MEMORY_WORK', score, level); 
      setTimeout(() => setGameState('finished'), 1500);
      return;
    }

    // Éxito
    if (newPlayerSequence.length === sequence.length) {
      setFeedback('correct');
      setScore(prevScore => prevScore + level * 10);
      
      setTimeout(() => {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        prepareLevel(nextLevel); 
      }, 1500);
    }
  };
  
  // --- CONEXIÓN SEGURA CON APIS ---
  
  const fetchAIFeedback = async (gameType: string, finalScore: number, finalLevel: number) => {
    try {
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
  };

  const saveGame = async () => {
    if (status !== 'authenticated') {
      toast.error("Debes iniciar sesión para guardar.");
      router.push('/login');
      return;
    }

    setIsLoading(true);
    const durationInSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      // CAMBIO CLAVE: No enviamos userId, la API lo sabe por la cookie
      const response = await fetch('/api/games/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'MEMORY_WORK', // Asegúrate que coincida con tu BD
          score, 
          level: level > 1 ? level - 1 : 1,
          durationSeconds: durationInSeconds,
        }),
      });

      if (!response.ok) throw new Error("Error al guardar");

      toast.success("¡Partida guardada!");
      router.push('/dashboard');

    } catch (error) {
      console.error("Error Save Game:", error);
      toast.error("Error al guardar la partida.");
    } finally {
      setIsLoading(false); // Siempre desbloqueamos el botón
    }
  };

  // --- EFECTOS ---

  useEffect(() => {
    if (gameState === 'showing' && sequence.length > 0) {
      let i = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);
      
      intervalRef.current = setInterval(() => {
        setActiveTile(sequence[i]);
        setTimeout(() => setActiveTile(null), 500);
        i++;
        if (i >= sequence.length) {
          clearInterval(intervalRef.current!);
          setTimeout(() => setGameState('playing'), 700);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, sequence]);

  return (
    <main className="game-page">
      <h1 className="game-title">🧠 Memoria de Trabajo</h1>
      
      {gameState !== 'finished' && (
        <div className="game-status-bar">
          <p>Nivel: <span className="game-status-value">{level}</span></p>
          <p>Puntos: <span className="game-status-value green">{score}</span></p>
        </div>
      )}

      <div className="game-board-container">
        {gameState === 'finished' ? (
          <div className="game-overlay">
            <h2 className="game-finished-title">¡Fin del Juego!</h2>
            
            <div className="game-final-score-box">
              <p>Puntuación Final</p>
              <span>{score}</span>
            </div>
            
            <div className="ai-feedback-box">
              <h3 className="ai-feedback-title">Análisis del Coach 🤖</h3>
              {feedbackFromAI ? (
                <p className="ai-feedback-text">{feedbackFromAI}</p>
              ) : (
                <p className="ai-feedback-text loading">Analizando tu partida...</p>
              )}
            </div>
            
            <button 
              onClick={saveGame} 
              disabled={isLoading} 
              className="game-button success"
              style={{ opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Guardando...' : 'Guardar y Salir'}
            </button>
          </div>
        ) : (
          <>
            {gameState === 'start' && (
              <div className="game-overlay">
                <p className="text-lg mb-6 text-center text-slate-300">
                  Memoriza la secuencia de luces y repítela en el mismo orden.
                </p>
                <button onClick={startGame} className="game-button primary">Empezar</button>
              </div>
            )}

            <div className="game-board">
              {[...Array(gridSize)].map((_, i) => {
                const isIlluminated = activeTile === i;
                const isClickable = gameState === 'playing';
                let tileClasses = "game-tile";
                if (isIlluminated) tileClasses += " illuminated";
                if (isClickable) tileClasses += " clickable";
                return <div key={i} onClick={() => handleTileClick(i)} className={tileClasses} />;
              })}
            </div>

            {feedback === 'correct' && (
              <div className="game-feedback-overlay">
                <div className="game-feedback-bubble success">¡Correcto! 👍</div>
              </div>
            )}
            {feedback === 'incorrect' && (
              <div className="game-feedback-overlay">
                <div className="game-feedback-bubble error">Ups... ❌</div>
              </div>
            )}
            
            {gameState !== 'start' && (
              <div className={`game-turn-indicator ${gameState === 'showing' ? 'showing' : 'playing'}`}>
                {gameState === 'showing' ? '👁️ OBSERVA...' : '👉 TU TURNO'}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}