// src/app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/auth';
import prisma from '../../../lib/prisma';



export async function GET(request: Request) {
  try {
    // 1. SEGURIDAD: En lugar de leer la URL, leemos la COOKIE de sesión
    const session = await auth();

    // Si no hay sesión, rechazamos la petición
    if (!session || !session.user) {
      return NextResponse.json({ message: 'No autorizado. Inicia sesión.' }, { status: 401 });
    }

    // 2. Extraemos el ID del usuario de la sesión
    // Usamos 'as any' por si TypeScript se queja del campo id
    const userId = (session.user as any).id;

    if (!userId) {
      return NextResponse.json({ message: 'Error de sesión: ID no encontrado.' }, { status: 401 });
    }

    // 3. Consultas a la Base de Datos (Igual que antes, pero con el userId seguro)
    const dailyLogs = await prisma.dailyLog.findMany({
      where: { userId: userId },
      orderBy: { date: 'asc' },
      take: 30, 
    });

    const gameSessions = await prisma.gameSession.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    return NextResponse.json({ dailyLogs, gameSessions });

  } catch (error) {
    console.error('[DASHBOARD_GET_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error al obtener los datos.' }, { status: 500 });
  }
}