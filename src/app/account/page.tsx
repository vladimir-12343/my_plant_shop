import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AccountClient from "@/components/AccountClient"
import { getServerSession } from "next-auth"
import { authOptions } from "../api/auth/[...nextauth]/route"

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const session = await getServerSession(authOptions)

  // Если нет сессии → отправляем на /login
  if (!session?.user?.email) {
    redirect("/login")
  }

  console.log("👉 SESSION:", session)

  // 👇 расширяем user, чтобы был role
  const userSession = session.user as typeof session.user & {
    id: string
    role: "USER" | "ADMIN"
  }

  // Если админ → отправляем в админку
  if (userSession.role === "ADMIN") {
    redirect("/admin/products")
  }

  // Ищем пользователя в БД
  const user = await prisma.user.findUnique({
    where: { email: userSession.email! },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!user) {
    redirect("/login")
  }

  // 👇 fullName всегда строка
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    userSession.email ||
    ""

  return <AccountClient user={user} fullName={fullName} />
}
