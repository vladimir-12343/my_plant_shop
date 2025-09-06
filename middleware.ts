// src/middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const isAdmin = req.nextUrl.pathname.startsWith("/admin")
      if (!isAdmin) return true
      return !!token && token.role === "ADMIN"
    },
  },
})

export const config = { matcher: ["/admin/:path*"] }
