"use client";
import { useState, useEffect, useRef } from 'react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: '¡Hola! Soy tu NeuroSync Coach. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Efecto para hacer scroll automático al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]); // Agregamos isLoading para que haga scroll cuando aparece el indicador de escritura

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // 1. Agregamos mensaje del usuario
    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Guardamos el input temporalmente y limpiamos el campo
    const messageToSend = input;
    setInput('');
    setIsLoading(true);

    try {
      // 2. Llamada a la API (Ruta relativa segura)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        throw new Error('Error en el servicio de chat');
      }

      const data = await response.json();
      
      // 3. Respuesta del Bot
      const botMessage: Message = { sender: 'bot', text: data.reply || 'No entendí, ¿puedes repetir?' };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Chat Error:", error);
      // Avisamos al usuario que hubo un error
      setMessages(prev => [...prev, { sender: 'bot', text: '😔 Lo siento, tuve un problema de conexión. Intenta de nuevo.' }]);
    } finally {
      // 4. Importante: Siempre apagamos el indicador de carga
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Botón Flotante */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`chatbot-button ${isOpen ? 'hidden' : ''}`}
        aria-label="Abrir chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Ventana del Chat */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h3>NeuroSync Coach 🧠</h3>
            <button onClick={() => setIsOpen(false)} aria-label="Cerrar chat">&times;</button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.sender}`}>
                <div className="message-bubble">{msg.text}</div>
              </div>
            ))}
            
            {/* Indicador de "Escribiendo..." */}
            {isLoading && (
              <div className="message-wrapper bot">
                <div className="message-bubble typing-indicator">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Escribe un mensaje..."
              className="chatbot-input"
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5' }}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}