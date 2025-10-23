import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  pages: {
    signIn: '/login', // Le decimos a NextAuth que nuestra página de login está en /login
  },
  callbacks: {
    // Este callback se usa para proteger rutas
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirige a /login si no está autenticado
      } else if (isLoggedIn) {
        // Si el usuario ya está logueado e intenta ir a /login o /register, lo mandamos al dashboard
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Dejamos esto vacío por ahora. Lo llenaremos en el siguiente archivo.
} satisfies NextAuthConfig;