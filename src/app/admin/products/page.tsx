// src/app/admin/products/page.tsx
import prisma from "@/lib/prisma"
import AdminProductsClient from "@/components/admin/AdminProductsClient"
import type { Prisma } from "@prisma/client"

export const dynamic = "force-dynamic"

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; category?: string; low?: string }>
}) {
  const sp = (await searchParams) ?? {}

  const q = sp.q?.trim() ?? ""
  const categoryFilter = sp.category ?? ""
  const lowOnly = sp.low === "1"

  // Порог берём из .env (по умолчанию 5)
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 5)

  // Используем официальный тип Prisma.ProductWhereInput
  const where: Prisma.ProductWhereInput = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(categoryFilter ? { categoryId: Number(categoryFilter) } : {}),
    ...(lowOnly ? { stock: { lte: threshold } } : {}),
  }

  // Сортировка
  const orderBy: Prisma.ProductOrderByWithRelationInput[] = lowOnly
    ? [{ stock: "asc" }, { updatedAt: "desc" }]
    : [{ createdAt: "desc" }]

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
