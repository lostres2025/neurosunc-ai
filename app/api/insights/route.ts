import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // 1. Importamos la seguridad
import prisma from '@/lib/prisma'; // 2. Usamos el import limpio (ajusta si usas ../../../)

export async function GET(request: Request) {
  try {
    // 3. SEGURIDAD: En lugar de leer la URL, leemos la SESIÓN
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado. Inicia sesión.' }, { status: 401 });
    }

    // 4. Obtenemos el ID seguro
    const userId = (session.user as any).id;

    // --- A PARTIR DE AQUÍ, TU LÓGICA DE NEGOCIO SIGUE IGUAL ---
    
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

        if (avgTotalScore > 0 && avgScoreGoodSleep > avgTotalScore * 1.1) {
          insights.push("Dato interesante: Tus puntuaciones tienden a ser más altas en los días que duermes bien. ¡Un buen descanso potencia tu mente!");
        }
      }
    }
    
    // Regla 3: Mejora en el Estado de Ánimo
    if (dailyLogs.length >= 4) {
        const firstHalf = dailyLogs.slice(0, Math.floor(dailyLogs.length / 2));
        const secondHalf = dailyLogs.slice(Math.floor(dailyLogs.length / 2));

        if (firstHalf.length > 0 && secondHalf.length > 0) {
            const avgMoodFirst = firstHalf.reduce((acc, log) => acc + log.mood, 0) / firstHalf.length;
            const avgMoodSecond = secondHalf.reduce((acc, log) => acc + log.mood, 0) / secondHalf.length;

            if (avgMoodSecond > avgMoodFirst) {
                insights.push("¡Buenas noticias! Tu estado de ánimo promedio ha mostrado una tendencia positiva recientemente. ¡Sigue así!");
            }
        }
    }

    // Si no se generó ningún insight, mandamos uno por defecto para que no se vea vacío
    if (insights.length === 0) {
        insights.push("Sigue registrando tus hábitos y juegos para descubrir patrones en tu rendimiento.");
    }

    return NextResponse.json({ insights });

  } catch (error) {
    console.error('[INSIGHTS_API_ERROR]', error);
    return NextResponse.json({ message: 'Error al generar insights.' }, { status: 500 });
  }
}