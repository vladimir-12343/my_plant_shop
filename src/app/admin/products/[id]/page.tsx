import prisma from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await prisma.product.findUnique({
    where: { id: Number(params.id) },
    include: { category: true },
  })

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  })

  if (!product) {
    return <div className="text-red-600">Товар не найден</div>
  }

  return (
    <div className="border rounded-2xl p-4">
      <h2 className="text-lg font-bold mb-4">Редактировать товар</h2>
      <ProductForm initial={product} categories={categories} />
    </div>
  )
}
