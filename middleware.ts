
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET!,
  });
  console.log("🔎 MIDDLEWARE ВЫЗВАН ДЛЯ:", req.nextUrl.pathname);

  console.log("🔎 Middleware token:", token);

  if (req.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (token["role"] !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
