// shop/[id]/page.tsx
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ShopPage({ params }: PageProps) {
  const id = Number(params.id)

  if (isNaN(id)) {
    return notFound()
  }

  // Получаем товар по id из БД
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true }, // если нужно вывести категорию
  })

  if (!product) {
    return notFound()
  }

  return (
    <main>
      <h1>{product.name}</h1>
      <p>Цена: {product.price} ₽</p>
      <p>Категория: {product.category?.name}</p>
      <p>{product.description}</p>
      {/* Добавь остальные данные и стили по необходимости */}
    </main>
  )
}
