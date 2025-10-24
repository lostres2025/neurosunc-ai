// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '../../../lib/prisma';



export async function GET(request: Request) {
  // Obtenemos los parámetros de la URL, por ejemplo: /api/dashboard?userId=clxxxx
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ message: 'Falta el ID del usuario.' }, { status: 400 });
  }

  try {
    // Buscamos los últimos 30 registros diarios del usuario
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: userId },
      orderBy: { date: 'asc' }, // Ordenados por fecha ascendente
      take: 30, // Limitamos a los últimos 30 para no sobrecargar
    });

    // Buscamos las últimas 50 sesiones de juego del usuario
    const gameSessions = await prisma.gameSession.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    // Devolvemos ambos conjuntos de datos en un solo objeto
    return NextResponse.json({ dailyLogs, gameSessions });

  } catch (error) {
    console.error('[DASHBOARD_GET_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error al obtener los datos.' }, { status: 500 });
  }
}