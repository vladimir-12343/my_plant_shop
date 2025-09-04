import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import AccountClient from "@/components/AccountClient"   // 👈 импортируем client-компонент

export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const c = await cookies()
  const email = c.get("userEmail")?.value
  const isAdmin = c.get("admin")?.value === "1"

  if (!email) redirect("/login")
  if (isAdmin) redirect("/admin/products")

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!user) redirect("/login")

  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || email

  return <AccountClient user={user} fullName={fullName} />
}
