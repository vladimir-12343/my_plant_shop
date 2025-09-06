import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import ProductDetail from "@/components/ProductDetail"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: PageProps) {
  // 👇 теперь ждём params
  const { id } = await params
  const productId = Number(id)
  if (isNaN(productId)) return notFound()

  const dbProduct = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      images: true,
    },
  })

  if (!dbProduct) return notFound()

  const product = {
    ...dbProduct,
    images: dbProduct.images.map((img) => img.url).filter(Boolean),
    coverImage: dbProduct.coverImage || dbProduct.images[0]?.url || null,
  }

  return <ProductDetail product={product} />
}
