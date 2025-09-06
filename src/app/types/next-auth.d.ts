// types/next-auth.d.ts
import type { DefaultSession } from "next-auth"
import type { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: "ADMIN" | "USER"
    } & DefaultSession["user"] // name, email, image
  }

  interface User {
    id: string
    role: "ADMIN" | "USER"
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: "ADMIN" | "USER"
  }
}
