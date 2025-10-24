// src/app/api/games/sessions/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '../../../../lib/prisma';



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, gameType, score, level } = body;

    // Validación
    if (!userId || !gameType || score === undefined || level === undefined) {
      return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
    }

    // Crear la nueva sesión de juego en la base de datos
    const newSession = await prisma.gameSession.create({
      data: {
        userId,
        gameType,
        score,
        level,
      },
    });

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('[GAME_SESSION_POST_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error interno.' }, { status: 500 });
  }
}