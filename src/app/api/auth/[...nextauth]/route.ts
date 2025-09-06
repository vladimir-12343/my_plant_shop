// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // 👇 возвращаем id (string), email и роль
        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  ...(process.env.NEXTAUTH_SECRET ? { secret: process.env.NEXTAUTH_SECRET } : {}),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token["id"] = (user as any).id;     // string
        token["role"] = (user as any).role; // string ("USER" | "ADMIN")
      } else if (token?.["id"]) {
        // обновляем роль из базы на всякий случай
        const dbUser = await prisma.user.findUnique({
          where: { id: token["id"] as string },
        });
        if (dbUser) token["role"] = dbUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.["id"]) {
        (session.user as any) = {
          ...(session.user || {}),
          id: token["id"],       // string
          role: token["role"],   // "USER" | "ADMIN"
        };
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
