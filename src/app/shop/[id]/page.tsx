import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import ProductDetail from "@/components/ProductDetail"

interface PageProps {
  params: { id: string }
}

export default async function ProductPage({ params }: PageProps) {
  const id = Number(params.id)
  if (isNaN(id)) return notFound()

  const dbProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: true,
    },
  })

  if (!dbProduct) return notFound()

  // 🎯 Нормализуем для ProductDetail
  const product = {
    ...dbProduct,
    images: dbProduct.images.map((img) => img.url), // ✅ только URL
  }

  return <ProductDetail product={product} />
}
