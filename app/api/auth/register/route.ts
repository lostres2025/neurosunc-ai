import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import prisma from '../../../../lib/prisma';
import bcrypt from 'bcryptjs';

// Creamos una instancia para hablar con la base de datos


// Esta función se ejecuta cuando alguien hace una petición "POST" a nuestra API
export async function POST(request: Request) {
  try {
    // 1. Leemos los datos que nos envía el formulario (el frontend)
    const body = await request.json();
    const { email, password } = body;

    // 2. Validamos que nos hayan enviado todo
    if (!email || !password) {
      return new NextResponse('Faltan el correo o la contraseña', { status: 400 });
    }

    // 3. Verificamos si el usuario ya existe en la base de datos
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return new NextResponse('El correo electrónico ya está en uso', { status: 409 });
    }

    // 4. Encriptamos la contraseña para no guardarla en texto plano (¡muy importante!)
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Creamos el nuevo usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // 6. Respondemos al frontend que todo salió bien
    return NextResponse.json(user);

  } catch (error) {
    console.error('[REGISTRATION_ERROR]', error);
    return new NextResponse('Error Interno del Servidor', { status: 500 });
  }
}