import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import prisma from './lib/prisma';
import { PrismaClient } from '@prisma/client';
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
          console.log("[AUTH.TS] Usuario encontrado en BD.");

          console.log("[AUTH.TS] Comparando contraseñas...");
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            console.log("[AUTH.TS] ¡Contraseñas coinciden! Login exitoso.");
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
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
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
      }
      return session;
    },
    ...authConfig.callbacks,
  },
});