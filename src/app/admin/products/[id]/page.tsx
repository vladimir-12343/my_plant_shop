import prisma from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"

export const dynamic = "force-dynamic"

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  const product = await prisma.product.findUnique({
    where: { id: Number(params.id) },
    include: {
      category: true,
      images: true, // 👈 добавили
    },
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
      <ProductForm
        initial={{
          id: product.id,
          name: product.name,
          description: product.description ?? "",
          price: product.price,
          compareAtPrice: product.compareAtPrice ?? undefined,
          stock: product.stock ?? 0,
          sku: product.sku ?? "",
          categoryId: product.categoryId,
          images: product.images.map((img) => img.url), // 👈 преобразовали
          discount: product.discount ?? 0,
        }}
        categories={categories}
      />
    </div>
  )
}
