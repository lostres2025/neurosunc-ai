// app/api/reports/weekly/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    // 1. Recopilamos los datos de los últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: userId, date: { gte: sevenDaysAgo } },
      orderBy: { date: 'asc' },
    });

    const gameSessions = await prisma.gameSession.findMany({
      where: { userId: userId, createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: 'asc' },
    });
    
    // Si no hay suficientes datos, no generamos reporte.
    if (dailyLogs.length < 2 && gameSessions.length < 2) {
        return NextResponse.json({ report: "No hay suficientes datos para generar un reporte semanal. ¡Sigue entrenando!" });
    }

    // 2. Creamos un prompt avanzado para la IA
    const systemPrompt = `
      Eres "NeuroSync Analyst", un experto en análisis de datos de rendimiento cognitivo.
      Tu tarea es analizar los datos de la última semana de un usuario y escribir un resumen narrativo de 3 puntos en formato de lista.
      El tono debe ser alentador, profesional y perspicaz.
      
      Los puntos deben ser:
      1.  **Un Logro Destacado:** Encuentra algo positivo y específico (ej. una nueva puntuación alta, buena consistencia, mejora en el ánimo).
      2.  **Un Patrón Interesante:** Descubre una correlación entre sus hábitos (sueño, ánimo, fatiga) y su rendimiento en los juegos. Sé específico.
      3.  **Una Sugerencia para la Próxima Semana:** Basado en los datos, ofrece un consejo claro y accionable para mejorar.

      IMPORTANTE: Responde SOLO con el texto del reporte, empezando cada punto con un emoji. No incluyas saludos ni despedidas.
      Ejemplo de formato de respuesta:
      - ✨ **Logro Destacado:** ¡Felicidades! Esta semana alcanzaste una nueva puntuación máxima de 250 en el juego de Memoria.
      - 🧠 **Patrón Interesante:** Notamos que tus 3 puntuaciones más altas ocurrieron en días donde tu nivel de fatiga era bajo (4/5 o más).
      - 🎯 **Sugerencia para la Próxima Semana:** Tu promedio de sueño fue de 6.5 horas. Intenta apuntar a 7.5 horas para ver si impacta positivamente en tu concentración.
    `;

    // 3. Preparamos los datos para que la IA los entienda
    const userData = `
      Datos de Check-in (últimos 7 días): ${JSON.stringify(dailyLogs)}
      Datos de Juegos (últimos 7 días): ${JSON.stringify(gameSessions)}
    `;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b", // Usamos un modelo más potente para análisis
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analiza los siguientes datos de usuario:\n${userData}` },
      ],
    });

    const report = completion.choices[0].message.content;
    
    return NextResponse.json({ report });

  } catch (error) {
    console.error('[WEEKLY_REPORT_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar el reporte semanal.' }, { status: 500 });
  }
}