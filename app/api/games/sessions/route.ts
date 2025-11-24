import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Importamos la autenticación
import prisma from '@/lib/prisma'; // Usamos el import limpio (ajusta si usas ../../../)

export async function POST(request: Request) {
  try {
    // 1. SEGURIDAD: Obtener usuario de la sesión
    const session = await auth();

    // Si no hay sesión o no hay ID de usuario, rechazamos
    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ message: 'No autorizado. Debes iniciar sesión.' }, { status: 401 });
    }

    // Obtenemos el ID real y seguro
    const userId = (session.user as any).id;

    // 2. Leer datos del juego (Ya no esperamos userId aquí)
    const body = await request.json();
    const { gameType, score, level, durationSeconds } = body;

    // Validación de datos del juego
    if (!gameType || score === undefined || level === undefined) {
      return NextResponse.json({ message: 'Faltan datos requeridos del juego.' }, { status: 400 });
    }

    // 3. Crear la nueva sesión en la base de datos
    const newSession = await prisma.gameSession.create({
      data: {
        userId, // Usamos el ID de la sesión
        gameType,
        score,
        level,
        durationSeconds: durationSeconds || 0, // Opcional, por defecto 0
      },
    });

    return NextResponse.json(newSession, { status: 201 });

  } catch (error) {
    console.error('[GAME_SESSION_POST_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error interno.' }, { status: 500 });
  }
}