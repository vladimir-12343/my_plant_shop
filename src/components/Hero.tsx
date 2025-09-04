'use client'
import { useState, useEffect } from "react"

const slides = [
  "/images/Blooming_Haven.png",
  "/images/Plant_Elegance.png",
  "/images/Spring_Garden.png",
]

export default function Hero() {
  const [index, setIndex] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const header = document.querySelector("header")
    if (header) {
      setHeaderHeight(header.offsetHeight)
    }
    const handleResize = () => {
      const header = document.querySelector("header")
      if (header) setHeaderHeight(header.offsetHeight)
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <section
      className="relative flex items-center justify-center text-white overflow-hidden"
      style={{ height: `calc(100vh - ${headerHeight}px)` }}
    >
      {/* слайды */}
      {slides.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      {/* затемнение */}
      <div className="absolute inset-0 bg-black/40" />

      {/* контент */}
      <div className="relative z-10 text-center px-4 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Исследуйте коллекцию BloomPlace
        </h1>
        <p className="text-lg md:text-2xl mb-6 text-gray-200">
          Новые редкие растения уже в наличии!
        </p>
        <button className="bg-white text-green-800 px-8 py-3 font-bold rounded-lg hover:bg-gray-100 transition-colors">
          Перейти в каталог
        </button>
      </div>
    </section>
  )
}
