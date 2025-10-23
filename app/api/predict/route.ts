// src/app/api/predict/route.ts
import { NextResponse } from 'next/server';

interface DailyLog {
  sleepHours: number;
  mood: number;
  fatigue: number;
}

// El Motor de Reglas Simple
function getPrediction(log: DailyLog): string | null {
  if (log.sleepHours < 6) {
    return "Notamos que dormiste poco. Tu enfoque podría ser menor hoy. Considera una siesta corta o una sesión de meditación para recargarte.";
  }
  if (log.fatigue <= 2 && log.mood <= 2) {
    return "Parece que empiezas el día con poca energía y bajo ánimo. Sé amable contigo mismo. Una rutina de ejercicios ligeros podría ayudar a mejorar tu estado.";
  }
  if (log.fatigue >= 4 && log.mood >= 4 && log.sleepHours >= 7) {
    return "¡Todos los indicadores son positivos! Parece que hoy será un día de alto rendimiento. ¡Aprovéchalo al máximo!";
  }
  return null; // No hay una predicción clara
}


export async function POST(request: Request) {
  try {
    const log = await request.json() as DailyLog;

    if (log.sleepHours === undefined || !log.mood || !log.fatigue) {
      return NextResponse.json({ message: 'Faltan datos del registro diario.' }, { status: 400 });
    }

    const prediction = getPrediction(log);

    // Solo devolvemos una respuesta si hay una predicción relevante
    if (prediction) {
      return NextResponse.json({ prediction });
    }
    
    // Si no hay predicción, devolvemos una respuesta vacía exitosa
    return new NextResponse(null, { status: 204 }); // 204 No Content

  } catch (error) {
    console.error('[PREDICT_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar la predicción.' }, { status: 500 });
  }
}