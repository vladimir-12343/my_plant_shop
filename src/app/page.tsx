'use client'

import Hero from '../components/Hero'
import HotspotGallery from '../components/HotspotGallery'
import CollectionsGrid from '../components/CollectionsGrid'

export default function PlantShop() {
  const menuItems = ['Главная', 'Магазин', 'О нас']
  const infoItems = ['Доставка', 'Оплата', 'Контакты']

  return (
    <div className="min-h-screen bg-white font-sans">
      <Hero />

      {/* Галерея */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
          Наши редкие растения
        </h2>
        <HotspotGallery />
      </section>

      {/* Видео — адаптивное 16:9 */}
      <section className="w-full">
        <div className="relative w-full aspect-video">
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="Видео о растениях"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </section>

      {/* Коллекции (если надо — оставляем; скажи, если убрать) */}
      <section className="w-full py-8 sm:py-12">
        <CollectionsGrid />
      </section>

      {/* Футер */}
      <footer className="bg-gray-900 text-white py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-3">RarePlants</h3>
            <p className="text-gray-400">Магазин редких комнатных растений</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">Меню</h4>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Информация</h4>
            <ul className="space-y-2">
              {infoItems.map((item) => (
                <li key={item}>
                  <a href="#" className="text-gray-400 hover:text-white">{item}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-3">Контакты</h4>
            <p className="text-gray-400">info@rareplants.ru</p>
            <p className="text-gray-400">+7 (999) 123-45-67</p>
          </div>
        </div>
      </footer>

      {/* Плавающая кнопка чата с учётом safe-area */}
      <div className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-4 sm:right-6">
        <button
          className="bg-green-700 hover:bg-green-800 text-white rounded-full p-4 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-300 transition"
          onClick={() => alert('Открытие чата...')}
          aria-label="Открыть чат"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
