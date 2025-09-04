// src/app/admin/products/page.tsx
import prisma from "@/lib/prisma";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams?: { q?: string; category?: string; low?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";
  const categoryFilter = searchParams?.category ?? "";
  const lowOnly = searchParams?.low === "1";

  // Порог берём из .env (по умолчанию 5)
  const threshold = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);

  // where формируем без лишних undefined
  const where: Parameters<typeof prisma.product.findMany>[0]["where"] = {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(categoryFilter ? { categoryId: Number(categoryFilter) } : {}),
    ...(lowOnly ? { stock: { lte: threshold } } : {}),
  };

  const orderBy =
    lowOnly
      ? [{ stock: "asc" as const }, { updatedAt: "desc" as const }]
      : [{ createdAt: "desc" as const }];

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminProductsClient
      products={products}
      categories={categories}
      // Если хотите использовать внутри клиента:
      // @ts-expect-error — пропсы опциональны для обратной совместимости
      lowOnly={lowOnly}
      // @ts-expect-error — опционально
      lowStockThreshold={threshold}
    />
  );
}
