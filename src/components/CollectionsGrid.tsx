"use client"
import Image from "next/image"

const collections = [
  {
    id: 1,
    title: "РЕДКИЕ РАСТЕНИЯ",
    subtitle: "НАША КОЛЛЕКЦИЯ",
    image: "/images/Colorful_Ageratum_Blossoms.png",
    link: "#",
  },
  {
    id: 2,
    title: "ИНДОНЕЗИЙСКАЯ ГОРДОСТЬ",
    subtitle: "НАША КОЛЛЕКЦИЯ",
    image: "/images/Blooming_Lobelia_Cascade.png",
    link: "#",
  },
  {
    id: 3,
    title: "ПЁСТРЫЕ",
    subtitle: "НАША КОЛЛЕКЦИЯ",
    image: "/images/Vibrant_Wax_Begonia_Display.png",
    link: "#",
  },
]

export default function CollectionsGrid() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 w-full">
        {collections.map((col) => (
          <div
            key={col.id}
            className="relative aspect-[5/6] w-full overflow-hidden rounded-none"
          >
            {/* Фото */}
            <Image
              src={col.image}
              alt={col.title}
              fill
              className="object-cover transition-transform duration-4000 ease-in-out hover:scale-120"
            />

            {/* Текст + кнопка снизу */}
            <div className="absolute bottom-8 left-0 right-0 flex flex-col items-start text-white px-8">
              {/* Подзаголовок */}
              <p className="text-xs md:text-sm tracking-[0.2em] mb-2 uppercase">
                {col.subtitle}
              </p>

              {/* Заголовок */}
              <h3 className="text-xl md:text-2xl font-semibold mb-6">
                {col.title}
              </h3>

              {/* Кнопка с плавной прозрачностью и увеличением */}
              <a
                href={col.link}
                className="relative inline-block px-6 py-3 text-xs md:text-sm uppercase tracking-wide font-medium border border-white bg-white text-black transition-all duration-700 ease-in-out hover:bg-transparent hover:text-white hover:scale-105"
              >
                Смотреть товары
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
