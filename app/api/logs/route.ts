import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // <--- IMPORTANTE: Ajusta la ruta si tu auth.ts está en otro lado (ej: ../../../auth)
import prisma from '@/lib/prisma'; // Usamos el alias @ para que sea más limpio

export async function POST(request: Request) {
  try {
    // 1. SEGURIDAD: Obtener el usuario desde la sesión (cookie)
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'No autorizado. Debes iniciar sesión.' }, { status: 401 });
    }

    const userId = (session.user as any).id; // ¡Aquí está el ID real!

    // 2. Obtener el resto de datos del cuerpo
    const body = await request.json();
    const { sleepHours, mood, fatigue } = body;

    // Validación
    if (sleepHours === undefined || !mood || !fatigue) {
      return NextResponse.json({ message: 'Faltan datos de salud.' }, { status: 400 });
    }
    
    // 3. Lógica de fecha (Ignorar horas)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 4. Guardar en Base de Datos
    const newLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: today,
        },
      },
      update: { sleepHours, mood, fatigue },
      create: {
        userId,
        date: today,
        sleepHours,
        mood,
        fatigue,
      },
    });

    return NextResponse.json(newLog, { status: 201 });

  } catch (error) {
    console.error('[LOGS_POST_ERROR]', error);
    return NextResponse.json({ message: 'Error interno del servidor.' }, { status: 500 });
  }
}