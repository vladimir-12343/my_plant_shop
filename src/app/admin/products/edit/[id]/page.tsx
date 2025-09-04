import prisma from "@/lib/prisma"
import AdminProductsClient from "@/components/admin/AdminProductsClient"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: {
    q?: string
    category?: string
    low?: string
  }
}) {
  const q = (searchParams?.q || "").trim()
  const categoryFilter = searchParams?.category || ""
  const lowOnly = searchParams?.low === "1"
  const threshold = 5

  // Вариант А: явный тип
  // const where: Prisma.ProductWhereInput = {
  //   ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  //   ...(categoryFilter ? { categoryId: Number(categoryFilter) } : {}),
  //   ...(lowOnly ? { stock: { lte: threshold } } : {}),
  // }

  // Вариант Б: satisfies (рекомендую)
  const where = {
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(categoryFilter ? { categoryId: Number(categoryFilter) } : {}),
    ...(lowOnly ? { stock: { lte: threshold } } : {}),
  } satisfies Prisma.ProductWhereInput

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { category: true, images: true },
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <AdminProductsClient
      products={products}
      categories={categories}
      lowStockThreshold={threshold}
    />
  )
}
