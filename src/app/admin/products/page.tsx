import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/lib/prisma"
import AdminProductsClient from "@/components/admin/AdminProductsClient"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string; low?: string }>
}) {
  const session = await getServerSession(authOptions)

  // 🚪 Гость → на логин
  if (!session) {
    redirect("/login")
  }

  // 👇 гарантируем, что user точно есть
  const userSession = session.user as typeof session.user & {
    id: string
    role: "USER" | "ADMIN"
  }

  // 🔒 Если не админ → редиректим в личный кабинет
  if (userSession.role !== "ADMIN") {
    redirect("/account")
  }

  // --- Фильтры ---
  const sp = (await searchParams) ?? {}
  const q = sp.q?.trim() ?? ""
  const categoryFilter = sp.category ?? ""
  const lowOnly = sp.low === "1"

  const threshold = Number(process.env["LOW_STOCK_THRESHOLD"] ?? 5)

  const where: Prisma.ProductWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(categoryFilter ? { categoryId: Number(categoryFilter) } : {}),
    ...(lowOnly ? { stock: { lte: threshold } } : {}),
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = lowOnly
    ? [{ stock: "asc" }, { updatedAt: "desc" }]
    : [{ createdAt: "desc" }]

  // --- Запросы к БД ---
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, images: true },
      orderBy,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <AdminProductsClient
      products={products}
      categories={categories}
      lowStockThreshold={threshold}
      lowOnly={lowOnly}
    />
  )
}
