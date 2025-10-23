import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Aquí es donde se crean y exportan los 'handlers'
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        if (credentials.email && credentials.password) {
          const email = credentials.email as string;
          const password = credentials.password as string;

          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
          });

          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) {
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
          }
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    // Extendemos el token para que incluya el ID del usuario
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Extendemos la sesión para que el cliente (nuestra app) pueda ver el ID del usuario
    async session({ session, token }) {
      if (token && session.user) {
        // TypeScript necesita que definamos 'id' en el tipo de usuario de la sesión
        (session.user as any).id = token.id;
      }
      return session;
    },
    // Mantenemos los otros callbacks que teníamos en auth.config
    ...authConfig.callbacks,
  },
});