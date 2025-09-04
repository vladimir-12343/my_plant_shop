'use client'
import { useEffect, useState } from 'react'
import Hero from "../components/Hero"
import ProductCard from "../components/ProductCard"
import HotspotGallery from "../components/HotspotGallery"
import CollectionsGrid from "../components/CollectionsGrid"

interface Subcategory {
  id: number
  name: string
}

interface Category {
  id: number
  name: string
  subcategories: Subcategory[]
}

interface Product {
  id: number
  name: string
  description?: string | null
  price: number
  discount?: number | null
  stock?: number | null
  coverImage?: string | null
  category?: { id: number; name: string } | null
}

export default function PlantShop() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories')
        ])

        if (!productsRes.ok || !categoriesRes.ok) {
          throw new Error('Ошибка загрузки данных')
        }

        const productsJson = await productsRes.json()
        const categoriesJson = await categoriesRes.json()

        setProducts(productsJson.data.products)
        setCategories(categoriesJson)
      } catch (err) {
        console.error('Ошибка при загрузке:', err)
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) {
    return <div className="text-center py-20">Загрузка...</div>
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600">
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  const menuItems = ['Главная', 'Магазин', 'О нас']
  const infoItems = ['Доставка', 'Оплата', 'Контакты']

  return (
    <div className="min-h-screen bg-white font-sans">

      <Hero />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Наши редкие растения
        </h2>
        <HotspotGallery />
      </section>

      {/* 📹 Видео блок на всю ширину без отступов */}
      <section className="w-full">
        <div className="relative w-full" style={{ paddingTop: "38%" }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Видео о растениях"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* Коллекции */}
      <section className="w-full py-12">
        <CollectionsGrid />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">НАШИ КОЛЛЕКЦИИ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id} 
              className="border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
            >
              <h3 className="font-bold text-xl mb-4">{category.name}</h3>
              <ul className="space-y-2">
                {(category.subcategories || []).map((subcat) => (
                  <li key={subcat.id}>
                    <a href="#" className="text-gray-600 hover:text-green-700 transition-colors">
                      {subcat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">ГОРЯЧИЕ ПРЕДЛОЖЕНИЯ</h2>
            <a 
              href="#" 
              className="text-green-700 hover:text-green-900 font-medium transition-colors"
            >
              Смотреть все →
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">RarePlants</h3>
            <p className="text-gray-400">Магазин редких комнатных растений</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Меню</h4>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Информация</h4>
            <ul className="space-y-2">
              {infoItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Контакты</h4>
            <p className="text-gray-400">info@rareplants.ru</p>
            <p className="text-gray-400">+7 (999) 123-45-67</p>
          </div>
        </div>
      </footer>

      <div className="fixed bottom-6 right-6">
        <button 
          className="bg-green-700 hover:bg-green-800 text-white rounded-full p-4 shadow-lg transition-colors"
          onClick={() => alert('Открытие чата...')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
              viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
