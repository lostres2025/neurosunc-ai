import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

console.log("[BACKEND] Cargando archivo auth.ts");
console.log("[BACKEND] DATABASE_URL:", process.env.DATABASE_URL ? "Encontrada" : "NO ENCONTRADA");

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("[BACKEND] 1. Entrando a la función 'authorize' con credenciales:", credentials);

        if (credentials.email && credentials.password) {
          const email = credentials.email as string;
          const password = credentials.password as string;

          try {
            console.log(`[BACKEND] 2. Buscando usuario: ${email}`);
            const user = await prisma.user.findUnique({
              where: { email: email.toLowerCase() },
            });

            if (!user) {
              console.log("[BACKEND] 3. Usuario NO encontrado en la BD.");
              return null;
            }
            console.log("[BACKEND] 3. Usuario encontrado:", user);

            console.log("[BACKEND] 4. Comparando contraseñas...");
            const passwordsMatch = await bcrypt.compare(password, user.password);

            if (passwordsMatch) {
              console.log("[BACKEND] 5. ¡Contraseña correcta! Login exitoso.");
              const { password: _, ...userWithoutPassword } = user;
              return userWithoutPassword;
            } else {
              console.log("[BACKEND] 5. Contraseña incorrecta.");
              return null;
            }
          } catch (error) {
            console.error("[BACKEND] 6. ERROR al conectar con la BD:", error);
            return null; // Devuelve null si hay un error de base de datos
          }
        }
        console.log("[BACKEND] 7. Credenciales incompletas.");
        return null;
      },
    }),
  ],
  // ... (el resto de tu configuración de sesión y callbacks no cambia)
});