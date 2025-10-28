import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // 1. IMPORTAMOS LA INSTANCIA CENTRAL

// const prisma = new PrismaClient(); // 2. ELIMINAMOS LA INSTANCIA LOCAL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyLogs = await prisma.dailyLog.findMany({
      where: { 
        userId: userId,
        date: { gte: sevenDaysAgo }
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

    const insights: string[] = [];

    // Regla 1: Consistencia
    if (dailyLogs.length >= 5) {
      insights.push(`¡Excelente consistencia! Has completado tu check-in ${dailyLogs.length} veces en la última semana.`);
    }

    // Regla 2: Correlación Sueño-Rendimiento
    if (dailyLogs.length >= 3 && gameSessions.length >= 3) {
      const goodSleepHours = dailyLogs.filter(log => log.sleepHours >= 7.5);
      const goodSleepDates = goodSleepHours.map(log => log.date.toISOString().split('T')[0]);
      
      const scoresOnGoodSleepDays = gameSessions.filter(session => 
        goodSleepDates.includes(session.createdAt.toISOString().split('T')[0])
      );

      if (scoresOnGoodSleepDays.length > 1) {
        const avgScoreGoodSleep = scoresOnGoodSleepDays.reduce((acc, s) => acc + s.score, 0) / scoresOnGoodSleepDays.length;
        const avgTotalScore = gameSessions.reduce((acc, s) => acc + s.score, 0) / gameSessions.length;

        // 3. MEJORA: Añadimos una validación para evitar división por cero
        if (avgTotalScore > 0 && avgScoreGoodSleep > avgTotalScore * 1.1) {
          insights.push("Dato interesante: Tus puntuaciones tienden a ser más altas en los días que duermes bien. ¡Un buen descanso potencia tu mente!");
        }
      }
    }
    
    // Regla 3: Mejora en el Estado de Ánimo
    if (dailyLogs.length >= 4) {
        const firstHalf = dailyLogs.slice(0, Math.floor(dailyLogs.length / 2));
        const secondHalf = dailyLogs.slice(Math.floor(dailyLogs.length / 2));

        // 3. MEJORA: Evitamos división por cero si una de las mitades está vacía
        if (firstHalf.length > 0 && secondHalf.length > 0) {
            const avgMoodFirst = firstHalf.reduce((acc, log) => acc + log.mood, 0) / firstHalf.length;
            const avgMoodSecond = secondHalf.reduce((acc, log) => acc + log.mood, 0) / secondHalf.length;

            if (avgMoodSecond > avgMoodFirst) {
                insights.push("¡Buenas noticias! Tu estado de ánimo promedio ha mostrado una tendencia positiva recientemente. ¡Sigue así!");
            }
        }
    }

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('[INSIGHTS_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar insights.' }, { status: 500 });
  }
}