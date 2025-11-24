import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
import { Role } from "@prisma/client"

// 1. Extendemos el tipo de la SESIÓN
declare module "next-auth" {
  interface Session {
    user: {
      role: Role // Aquí le decimos que "role" existe y es tipo Role
    } & DefaultSession["user"]
  }

  interface User {
    role: Role
  }
}

// 2. Extendemos el tipo del JWT (el token encriptado)
declare module "next-auth/jwt" {
  interface JWT {
    role: Role
  }
}