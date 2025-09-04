'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Product = {
  id: number
  name: string
  price: number
}

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userRole = localStorage.getItem('role')
    if (userRole !== 'admin') {
      router.push('/')
    }

    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data.data.products))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <div className="p-10 text-center">Загрузка...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
      <div className="space-y-4">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm text-gray-600">Цена: {product.price} ₽</p>
              </div>
              <div className="space-x-2">
                <button className="bg-yellow-500 text-white px-4 py-1 rounded">Редактировать</button>
                <button className="bg-red-600 text-white px-4 py-1 rounded">Удалить</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-6 bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">Добавить товар</button>
    </div>
  )
}
