import prisma from "@/lib/prisma"
import ProductDetail from "@/components/ProductDetail"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: PageProps) {
  // 👇 дожидаемся params
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
    include: { category: true },
  })

  if (!product) {
    return (
      <div className="p-8 text-center text-gray-500">
        Товар не найден
      </div>
    )
  }

  return <ProductDetail product={product} />
}
