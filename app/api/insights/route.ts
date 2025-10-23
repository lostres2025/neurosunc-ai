// app/api/insights/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    // Obtenemos los datos de la última semana
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { 
        userId: userId,
        date: { gte: sevenDaysAgo } // gte = greater than or equal
      },
      orderBy: { date: 'asc' },
    });

    const gameSessions = await prisma.gameSession.findMany({
      where: { 
        userId: userId,
        createdAt: { gte: sevenDaysAgo }
      },
      orderBy: { createdAt: 'asc' },
    });

    // --- INICIO DEL MOTOR DE REGLAS PARA GENERAR INSIGHTS ---
    const insights: string[] = [];

    // Regla 1: Consistencia en el Check-in
    if (dailyLogs.length >= 5) {
      insights.push(`¡Excelente consistencia! Has completado tu check-in ${dailyLogs.length} veces en la última semana.`);
    }

    // Regla 2: Correlación Sueño-Rendimiento (si hay suficientes datos)
    if (dailyLogs.length >= 3 && gameSessions.length >= 3) {
      const goodSleepHours = dailyLogs.filter(log => log.sleepHours >= 7.5);
      const goodSleepDates = goodSleepHours.map(log => log.date.toISOString().split('T')[0]);
      
      const scoresOnGoodSleepDays = gameSessions.filter(session => 
        goodSleepDates.includes(session.createdAt.toISOString().split('T')[0])
      );

      if (scoresOnGoodSleepDays.length > 1) {
        const avgScoreGoodSleep = scoresOnGoodSleepDays.reduce((acc, s) => acc + s.score, 0) / scoresOnGoodSleepDays.length;
        const avgTotalScore = gameSessions.reduce((acc, s) => acc + s.score, 0) / gameSessions.length;

        if (avgScoreGoodSleep > avgTotalScore * 1.1) { // Si es un 10% mejor
          insights.push("Dato interesante: Tus puntuaciones tienden a ser más altas en los días que duermes bien. ¡Un buen descanso potencia tu mente!");
        }
      }
    }
    
    // Regla 3: Mejora en el Estado de Ánimo
    if (dailyLogs.length >= 4) {
        const firstHalfMood = dailyLogs.slice(0, Math.floor(dailyLogs.length / 2));
        const secondHalfMood = dailyLogs.slice(Math.floor(dailyLogs.length / 2));
        const avgMoodFirst = firstHalfMood.reduce((acc, log) => acc + log.mood, 0) / firstHalfMood.length;
        const avgMoodSecond = secondHalfMood.reduce((acc, log) => acc + log.mood, 0) / secondHalfMood.length;

        if (avgMoodSecond > avgMoodFirst) {
            insights.push("¡Buenas noticias! Tu estado de ánimo promedio ha mostrado una tendencia positiva recientemente. ¡Sigue así!");
        }
    }

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('[INSIGHTS_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar insights.' }, { status: 500 });
  }
}