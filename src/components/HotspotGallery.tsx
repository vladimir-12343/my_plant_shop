"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

type Product = {
  id: number;
  name: string;
  price: number;
  image: string;
  hotspot: { top: string; left: string };
};

const products: Product[] = [
  {
    id: 1,
    name: "Яркая Бегония Восковая",
    price: 100,
    image: "/images/Vibrant_Wax_Begonia_Display.png",
    hotspot: { top: "20%", left: "40%" },
  },
  {
    id: 2,
    name: "Цветущий Агератум",
    price: 200,
    image: "/images/Colorful_Ageratum_Blossoms.png",
    hotspot: { top: "60%", left: "75%" },
  },
  {
    id: 3,
    name: "Каскад Лобелии",
    price: 300,
    image: "/images/Blooming_Lobelia_Cascade.png",
    hotspot: { top: "75%", left: "15%" },
  },
];

export default function HotspotGallery() {
  // ✅ если массив когда-то окажется пустым — будет null, а не undefined
  const [selected, setSelected] = useState<Product | null>(() => products[0] ?? null);

  return (
    <div className="flex flex-col md:flex-row items-center justify-center">
      {/* Левая часть: большая картинка с точками */}
      <div className="relative">
        <Image
          src="/images/Vibrant_Summer_Garden.png"
          alt="Коллекция растений"
          width={600}
          height={500}
          className="w-full h-auto"
          priority
        />

        {/* Точки на картинке */}
        {products.map((p) => (
          <button
            key={p.id}
            className={`absolute w-6 h-6 bg-white border-2 rounded-full shadow-md transition
              ${selected?.id === p.id ? "border-amber-600" : "border-white hover:border-amber-600"}`}
            style={{ top: p.hotspot.top, left: p.hotspot.left }}
            onClick={() => setSelected(p)}
            aria-label={`Показать "${p.name}"`}
          />
        ))}
      </div>

      {/* Правая часть: карточка товара */}
      <div className="flex flex-col items-center text-center ml-0 md:ml-20">
        <AnimatePresence mode="wait">
          {selected && (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center w-full max-w-xs"
            >
              <Image
                src={selected.image}
                alt={selected.name}
                width={320}
                height={240}
                className="mb-4 w-auto h-auto"
              />

              <h2 className="text-sm font-medium tracking-[0.2em] uppercase mb-1 text-gray-800">
                {selected.name}
              </h2>

              <p className="text-gray-700 mb-4 text-base">
                {selected.price.toLocaleString()} ₽
              </p>

              <button className="w-full bg-[#c4a484] hover:bg-[#b39070] text-white py-3 rounded-sm uppercase tracking-wide text-sm">
                Смотреть товар
              </button>

              <div className="flex space-x-2 mt-6">
                {products.map((p) => (
                  <button
                    key={`dot-${p.id}`}
                    onClick={() => setSelected(p)}
                    aria-label={`Перейти к "${p.name}"`}
                    className={`w-3 h-3 rounded-full transition ${
                      selected?.id === p.id
                        ? "bg-gray-800"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
