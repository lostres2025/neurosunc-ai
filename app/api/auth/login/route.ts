// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 1. Validar que los datos llegaron
    if (!email || !password) {
      return NextResponse.json({ message: 'Correo y contraseña son requeridos.' }, { status: 400 });
    }

    // 2. Buscar al usuario en la base de datos por su email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Si no se encuentra el usuario, devolvemos un error genérico para no dar pistas a atacantes
    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 }); // 401 Unauthorized
    }

    // 3. Comparar la contraseña enviada con la contraseña encriptada en la base de datos
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // Si las contraseñas no coinciden, devolvemos el mismo error genérico
    if (!isPasswordCorrect) {
      return NextResponse.json({ message: 'Credenciales inválidas.' }, { status: 401 });
    }

    // 4. ¡Éxito! El usuario es válido.
    // En un futuro, aquí generaríamos un token de sesión (JWT). Por ahora, solo confirmamos el éxito.
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error) {
    console.error('[LOGIN_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error interno en el servidor.' }, { status: 500 });
  }
}