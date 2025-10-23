"use client";
import { API_BASE_URL } from '../../../app.config';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

type GameState = 'start' | 'showing' | 'playing' | 'finished';

export default function MemoryWorkGame() {
  const router = useRouter();
  const { data: session } = useSession();
  
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

  const generateSequence = useCallback(() => {
    const newSequence: number[] = [];
    for (let i = 0; i < level + 2; i++) {
      newSequence.push(Math.floor(Math.random() * gridSize));
    }
    setSequence(newSequence);
  }, [level]);

  const startGame = useCallback(() => {
    setPlayerSequence([]);
    setFeedback(null);
    setActiveTile(null);
    setFeedbackFromAI(null);
    if (level === 1 && startTime === 0) {
      setStartTime(Date.now());
    }
    generateSequence();
    setGameState('showing');
  }, [generateSequence, level, startTime]);

  const fetchAIFeedback = useCallback(async (gameType: string, finalScore: number, finalLevel: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/games/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, score: finalScore, level: finalLevel }),
      });
      if (response.ok) {
        const data = await response.json();
        setFeedbackFromAI(data.feedback);
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
  }, []);

  useEffect(() => {
    if (gameState === 'showing' && sequence.length > 0) {
      let i = 0;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setActiveTile(sequence[i]);
        setTimeout(() => setActiveTile(null), 500);
        i++;
        if (i >= sequence.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => setGameState('playing'), 700);
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gameState, sequence]);

  const handleTileClick = useCallback((tileIndex: number) => {
    if (gameState !== 'playing') return;
    setActiveTile(tileIndex);
    setTimeout(() => setActiveTile(null), 200);
    const newPlayerSequence = [...playerSequence, tileIndex];
    setPlayerSequence(newPlayerSequence);
    
    if (sequence[newPlayerSequence.length - 1] !== tileIndex) {
      setFeedback('incorrect');
      fetchAIFeedback('MEMORY_WORK', score, level);
      setTimeout(() => setGameState('finished'), 1500);
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setFeedback('correct');
      setScore(prevScore => prevScore + level * 10);
      setTimeout(() => {
        setLevel(prevLevel => prevLevel + 1);
        // Prepara para el siguiente nivel, que se iniciará con el useEffect
        setPlayerSequence([]);
        setFeedback(null);
        setActiveTile(null);
        setFeedbackFromAI(null);
        setGameState('showing');
      }, 1500);
    }
  }, [gameState, playerSequence, sequence, fetchAIFeedback, score, level]);

  const saveGame = async () => {
    setIsLoading(true);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      toast.error("Error: Usuario no autenticado.");
      router.push('/login');
      return;
    }
    
    const durationInSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
      await fetch(`${API_BASE_URL}/api/games/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          gameType: 'MEMORY_WORK', 
          score, 
          level: level > 1 ? level - 1 : 1,
          durationSeconds: durationInSeconds,
        }),
      });
      toast.success("¡Partida guardada!");
      router.push('/dashboard');
    } catch (error) {
      toast.error("Error al guardar la partida.");
      setIsLoading(false);
    }
  };

  return (
    <main className="game-page">
      <h1 className="game-title">Juego de Memoria</h1>
      
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
              <h3 className="ai-feedback-title">Análisis del Coach</h3>
              {feedbackFromAI ? (
                <p className="ai-feedback-text">{feedbackFromAI}</p>
              ) : (
                <p className="ai-feedback-text loading">Analizando tu partida...</p>
              )}
            </div>
            <button onClick={saveGame} disabled={isLoading} className="game-button success">
              {isLoading ? 'Guardando...' : 'Guardar y Salir'}
            </button>
          </div>
        ) : (
          <>
            {gameState === 'start' && feedback !== 'correct' && (
              <div className="game-overlay">
                <p>Observa la secuencia y repítela.</p>
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

            {feedback === 'correct' && <div className="game-feedback-overlay"><div className="game-feedback-bubble success">¡Nivel Completado!</div></div>}
            {feedback === 'incorrect' && <div className="game-feedback-overlay"><div className="game-feedback-bubble error">Incorrecto</div></div>}
            
            {gameState !== 'start' && (
              <div className={`game-turn-indicator ${gameState === 'showing' ? 'showing' : 'playing'}`}>
                {gameState === 'showing' ? 'OBSERVA...' : 'TU TURNO'}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}