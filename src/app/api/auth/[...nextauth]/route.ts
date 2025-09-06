import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
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

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  // 👇 кастомные страницы
  pages: {
    signIn: "/login", // вместо дефолтной страницы входа используем свою
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token["id"] = (user as any).id;
        token["role"] = (user as any).role;
      } else if (token?.["id"]) {
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
          id: token["id"],
          role: token["role"],
        };
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
