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

        // id должен быть строкой
        return { id: String(user.id), email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  // добавляем secret только если он есть, иначе ключ не попадает в объект
  ...(process.env.NEXTAUTH_SECRET ? { secret: process.env.NEXTAUTH_SECRET } : {}),
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token["id"] = (user as any).id; // прокинем id в токен
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.["id"]) {
        (session.user as any) = { ...(session.user || {}), id: token["id"] };
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
