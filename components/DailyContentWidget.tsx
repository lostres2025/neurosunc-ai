"use client";

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../app.config'; 

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
        } else {
          // Si la respuesta no es OK, lo registramos para saberlo
          console.error("DailyContent: La respuesta de la API no fue 'ok'.");
        }
      } catch (error) {
        console.error("DailyContent: Error de red al hacer fetch:", error);
      } finally {
        // --- CORRECCIÓN CLAVE ---
        // Este bloque se ejecuta siempre, tanto si hay éxito como si hay error.
        setIsLoading(false);
        // --- FIN DE LA CORRECCIÓN ---
      }
    };
    fetchContent();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al cargar el componente

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