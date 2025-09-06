import prisma from "@/lib/prisma"
import ProductCard, { ProductCardProduct } from "@/components/ProductCard"

export const dynamic = "force-dynamic"   // ✅ всегда свежие данные

export default async function AllPlantsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true, images: true },
  })

  const formatted: ProductCardProduct[] = products.map((p) => {
    const images = p.images.map((img) => img.url).filter(Boolean)
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      discount: p.discount,
      stock: p.stock ?? 0,
      coverImage: p.coverImage || images[0] || null,
      images,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Все растения</h1>

      {formatted.length === 0 ? (
        <p className="text-gray-500">Товары отсутствуют</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {formatted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
