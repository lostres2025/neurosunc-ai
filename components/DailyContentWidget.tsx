"use client";
import { API_BASE_URL } from '../app.config';
import { useState, useEffect } from 'react';

export default function DailyContentWidget() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/daily-content`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
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
    fetchContent();
  }, []); // Se ejecuta solo una vez al cargar el componente

  if (isLoading) {
    return (
      <div className="widget">
        <div className="daily-content-loader"></div>
      </div>
    );
  }

  if (!content) {
    return null; // No renderizar nada si no se pudo obtener el contenido
  }

  return (
    <div className="widget">
      <h2 className="widget-title">Tu Momento del Día</h2>
      <p className="daily-content-text">&quot;{content}&quot;</p>
    </div>
  );
}