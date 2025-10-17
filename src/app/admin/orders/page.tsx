// src/app/admin/orders/page.tsx
import prisma from "@/lib/prisma"
import AdminOrdersKanban from "@/components/admin/AdminOrdersKanban"
import { Prisma, OrderStatus } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Search = {
  status?: string | string[]
  date?: string | string[]
  q?: string | string[]
  sort?: string | string[]
}

export default async function OrdersPage({ searchParams }: { searchParams?: Search }) {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    redirect(`/login?callbackUrl=/admin/orders`)
  }

  const sp = searchParams ?? {}
  const status = typeof sp.status === "string" ? sp.status : ""
  const date   = typeof sp.date   === "string" ? sp.date   : ""
  const q      = (typeof sp.q     === "string" ? sp.q     : "").trim().toLowerCase()
  const sort   = typeof sp.sort   === "string" ? sp.sort   : "date_desc"

  let createdAtFilter: Prisma.OrderWhereInput["createdAt"]
  if (date === "today") {
    createdAtFilter = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  } else if (date === "week") {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    createdAtFilter = { gte: d }
  } else if (date === "month") {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    createdAtFilter = { gte: d }
  }

  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sort === "date_asc"   ? { createdAt: "asc" }  :
    sort === "total_desc" ? { total: "desc" }     :
    sort === "total_asc"  ? { total: "asc" }      :
                            { createdAt: "desc" }

  const validStatus = (Object.values(OrderStatus) as string[]).includes(status)
    ? (status as OrderStatus)
    : undefined

  const orders = await prisma.order.findMany({
    where: {
      ...(validStatus ? { status: validStatus } : {}),
      ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
      ...(q
        ? {
            OR: [
              { user: { is: { email:     { contains: q, mode: "insensitive" } } } },
              { user: { is: { firstName: { contains: q, mode: "insensitive" } } } },
              { user: { is: { lastName:  { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    orderBy,
    include: { user: true },
  })

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Заказы (Kanban)</h1>
      <AdminOrdersKanban orders={orders} />
    </div>
  )
}
