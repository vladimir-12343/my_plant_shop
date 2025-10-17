// src/lib/auth.ts
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import type { AuthOptions } from "next-auth"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },            // ✅ проще для API-роутов
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user) return null

        // TODO: если в БД пароль хранится в виде hash
        const ok = await bcrypt.compare(credentials.password, user.password ?? "")
        if (!ok) return null

        // Верните ровно то, что должно попасть в токен (без пароля)
        return {
          id: user.id,
          email: user.email,
          name: user.firstName ?? user.email,
          role: user.role, // "ADMIN" | "USER"
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
