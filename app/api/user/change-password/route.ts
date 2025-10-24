// app/api/user/change-password/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    // 1. Validación de entrada de datos
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ message: 'Todos los campos son requeridos.' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    // 2. Buscar al usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    // 3. Verificar que la contraseña actual sea correcta
    const isCurrentPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isCurrentPasswordCorrect) {
      return NextResponse.json({ message: 'La contraseña actual es incorrecta.' }, { status: 403 }); // 403 Forbidden
    }

    // 4. Encriptar la nueva contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 5. Actualizar la contraseña en la base de datos
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    // 6. Enviar una respuesta de éxito
    return NextResponse.json({ message: 'Contraseña actualizada con éxito.' }, { status: 200 });

  } catch (error) {
    console.error('[CHANGE_PASSWORD_API_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error interno en el servidor.' }, { status: 500 });
  }
}