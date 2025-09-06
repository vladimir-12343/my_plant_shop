import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AccountClient from "@/components/AccountClient"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route" // 👈 путь к твоему NextAuth

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect("/login")
  }
  console.log("👉 SESSION:", session)

  // Если админ → редиректим в админку
  if (session.user.role === "ADMIN") {
    redirect("/admin/products")
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!user) redirect("/login")

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || session.user.email

  return <AccountClient user={user} fullName={fullName} />
}
