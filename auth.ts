import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

console.log("[AUTH.TS] Archivo cargado.");
console.log("[AUTH.TS] DATABASE_URL:", process.env.DATABASE_URL ? "Encontrada" : "¡NO ENCONTRADA!");

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log("[AUTH.TS] -> Entrando a 'authorize' con:", credentials.email);

        if (!credentials.email || !credentials.password) {
          console.log("[AUTH.TS] Credenciales incompletas.");
          return null;
        }
          
        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          console.log(`[AUTH.TS] Buscando usuario: ${email.toLowerCase()}`);
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) {
            console.log("[AUTH.TS] Usuario NO encontrado.");
            return null;
          }
          console.log("[AUTH.TS] Usuario encontrado en BD. ID:", user.id);

          console.log("[AUTH.TS] Comparando contraseñas...");
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log("[AUTH.TS] ¡Contraseñas coinciden! Login exitoso.");
            // Retornamos el usuario completo. Prisma ya incluye 'id' y 'role'
            return user;
          } else {
            console.log("[AUTH.TS] ¡Contraseñas NO coinciden!");
            return null;
          }
        } catch (error) {
          console.error("[AUTH.TS] ERROR DE BASE DE DATOS:", error);
          return null;
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    // 1. JWT: Se ejecuta al hacer login. Aquí guardamos los datos en el token encriptado.
    async jwt({ token, user }) {
      if (user) {
        // Guardamos explícitamente el ID y el ROL
        token.id = user.id;
        token.role = (user as any).role;
        console.log("[AUTH.TS] JWT Generado - ID Guardado:", token.id);
      }
      return token;
    },
    // 2. SESSION: Se ejecuta cada vez que el usuario navega o llama a la API.
    async session({ session, token }) {
      if (token && session.user) {
        // Pasamos los datos del token a la sesión visible
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
    // NOTA: He eliminado '...authConfig.callbacks' aquí para evitar que sobrescriba 
    // la lógica de ID y ROL que acabamos de definir arriba.
  },
});