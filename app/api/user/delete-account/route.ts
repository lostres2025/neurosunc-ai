// app/api/user/delete-account/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, password } = body;

    if (!userId || !password) {
      return NextResponse.json({ message: 'Se requiere ID de usuario y contraseña.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ message: 'Usuario no encontrado.' }, { status: 404 });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return NextResponse.json({ message: 'La contraseña es incorrecta.' }, { status: 403 });
    }

    // Si la contraseña es correcta, procedemos a eliminar el usuario.
    // Prisma se encargará de borrar en cascada los DailyLog y GameSession asociados.
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ message: 'Cuenta eliminada con éxito.' }, { status: 200 });

  } catch (error) {
    console.error('[DELETE_ACCOUNT_API_ERROR]', error);
    return NextResponse.json({ message: 'Ocurrió un error interno.' }, { status: 500 });
  }
}