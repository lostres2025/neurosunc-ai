// src/app/api/logs/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Nota: En un proyecto real, necesitaríamos obtener el ID del usuario de la sesión (ej. con NextAuth).
// Por AHORA, para poder probar, vamos a asumir que el frontend nos envía un `userId`.
// ¡Esto es TEMPORAL y lo haremos seguro más adelante!

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sleepHours, mood, fatigue } = body;

    // --- Validación de los datos recibidos ---
    if (!userId || sleepHours === undefined || !mood || !fatigue) {
      return NextResponse.json({ message: 'Faltan datos requeridos.' }, { status: 400 });
    }
    
    // --- Lógica de la API ---
    
    // 1. Obtener la fecha de hoy, pero sin la hora (solo día, mes, año)
    // Esto es crucial para que el @@unique([userId, date]) funcione correctamente.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 2. Intentar crear el nuevo registro en la base de datos
    // Usamos `upsert` que es una operación inteligente:
    // - Intenta ENCONTRAR un log para este usuario en esta fecha.
    // - Si lo encuentra (es decir, el usuario ya hizo check-in hoy), lo ACTUALIZA (update).
    // - Si NO lo encuentra, lo CREA (create).
    // Esto evita errores y permite al usuario corregir su check-in durante el día.
    const newLog = await prisma.dailyLog.upsert({
      where: {
        userId_date: { // Este es el nombre del índice @@unique que creamos
          userId: userId,
          date: today,
        },
      },
      update: {
        sleepHours,
        mood,
        fatigue,
      },
      create: {
        userId,
        date: today,
        sleepHours,
        mood,
        fatigue,
      },
    });

    // 3. Responder con el registro creado/actualizado
    return NextResponse.json(newLog, { status: 201 });

  } catch (error) {
    console.error('[LOGS_POST_ERROR]', error);
    // Manejar errores específicos, como si el usuario no existe
    if (error instanceof Error && error.message.includes('foreign key constraint fails')) {
        return NextResponse.json({ message: 'El usuario especificado no existe.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Ocurrió un error interno en el servidor.' }, { status: 500 });
  }
}