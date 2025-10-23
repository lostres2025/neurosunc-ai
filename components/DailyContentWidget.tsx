"use client";

import { useState, useEffect } from 'react';

export default function DailyContentWidget() {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/daily-content');
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        }
      } catch (error) {
        console.error("Error fetching daily content:", error);
        // Si hay un error, simplemente no mostramos el widget
      } finally {
        setIsLoading(false);
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
      <p className="daily-content-text">"{content}"</p>
    </div>
  );
}