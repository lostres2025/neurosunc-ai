"use client";

import { useState, useEffect, useMemo } from 'react';
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
  const { data: session } = useSession();

  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState(COLORS[0]);
  const [currentColor, setCurrentColor] = useState(COLORS[1]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackFromAI, setFeedbackFromAI] = useState<string | null>(null);

  const shuffledOptions = useMemo(() => [...COLORS].sort(() => 0.5 - Math.random()), [currentWord]);

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

  const nextRound = () => {
    let newWord, newColor;
    do {
      newWord = COLORS[Math.floor(Math.random() * COLORS.length)];
      newColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    } while (newWord.name === newColor.name);
    setCurrentWord(newWord);
    setCurrentColor(newColor);
  };

  // --- useEffect CORREGIDO ---
  useEffect(() => {
    if (gameState !== 'playing') return; // Si no estamos jugando, no hacer nada.

    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // El tiempo llegó a 0 MIENTRAS JUGÁBAMOS
      setGameState('finished');
      fetchAIFeedback('ATTENTION_STROOP', score, 1);
    }
  }, [gameState, timeLeft, score, fetchAIFeedback]);
  // --- FIN DE LA CORRECCIÓN ---

  const startGame = () => {
    setScore(0);
    setTimeLeft(60);
    setFeedbackFromAI(null);
    setGameState('playing');
    nextRound();
  };

  const handleAnswer = (selectedColorName: string) => {
    if (gameState !== 'playing') return;
    if (selectedColorName === currentColor.name) {
      setScore(score + 10);
    } else {
      setScore(score > 0 ? score - 5 : 0);
    }
    nextRound();
  };
  
  const saveGame = async () => {
    setIsLoading(true);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      toast.error("Error: Usuario no autenticado.");
      router.push('/login');
      return;
    }
    try {
      await fetch('/api/games/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, gameType: 'ATTENTION_STROOP', score, level: 1, durationSeconds: 60 }),
      });
      toast.success("¡Partida guardada!");
      router.push('/dashboard');
    } catch (error) {
      toast.error("Error al guardar la partida.");
      setIsLoading(false);
    }
  };

  const renderGameContent = () => {
    switch (gameState) {
      case 'finished':
        return (
          <div className="game-overlay">
            <h2 className="game-finished-title">¡Tiempo!</h2>
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
            <div className="stroop-finished-buttons">
              <button onClick={saveGame} disabled={isLoading} className="game-button success">
                {isLoading ? 'Guardando...' : 'Guardar y Salir'}
              </button>
              <button onClick={startGame} className="game-button primary">Jugar de Nuevo</button>
            </div>
          </div>
        );
      case 'playing':
        return (
          <div className="stroop-playing-container">
            <p className="stroop-instruction">Presiona el color de la <strong>tinta</strong></p>
            <div className="stroop-word" style={{ color: currentColor.value }}>
              {currentWord.name}
            </div>
            <div className="stroop-options-grid">
              {shuffledOptions.map((color) => (
                <button 
                  key={color.name}
                  onClick={() => handleAnswer(color.name)}
                  className="stroop-option-button"
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        );
      case 'start':
      default:
        return (
          <div className="game-overlay">
            <h2 className="game-title stroop">Test de Atención</h2>
            <p>Aparecerá una palabra de un color. Tu objetivo es presionar el botón del <strong>color de la tinta</strong>, ignorando la palabra.</p>
            <p>¡Acierta lo más que puedas en 60 segundos!</p>
            <button onClick={startGame} className="game-button primary">Empezar</button>
          </div>
        );
    }
  };

  return (
    <main className="game-page">
      <div className="game-status-bar stroop">
        <p>Puntos: <span className="game-status-value green">{score}</span></p>
        <p>Tiempo: <span className="game-status-value yellow">{timeLeft}</span></p>
      </div>
      <div className="game-board-container stroop">
        {renderGameContent()}
      </div>
    </main>
  );
}