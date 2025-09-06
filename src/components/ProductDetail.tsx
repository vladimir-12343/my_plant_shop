"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/CartContext";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  discount?: number | null;
  coverImage?: string | null;
  stock: number;
  images?: string[] | null;
}

// 👇 единый fallback (Cloudinary URL)
const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dqeusirkr/image/upload/v1757154692/product-placeholder-wp_zzdg2j.jpg";

export default function ProductDetail({ product }: { product: Product }) {
  const { addToCart } = useCart();

  const discount = product.discount ?? 0;
  const hasDiscount = discount > 0;
  const oldPrice = product.price;
  const newPrice = hasDiscount
    ? Math.round(product.price * (1 - discount / 100))
    : product.price;

  const [quantity, setQuantity] = useState(1);

  const increase = () => setQuantity((q) => (q < product.stock ? q + 1 : q));
  const decrease = () => setQuantity((q) => (q > 1 ? q - 1 : q));

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: newPrice,
      coverImage: product.coverImage || FALLBACK_IMAGE,
      quantity,
      stock: product.stock,
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Фото */}
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden">
        <Image
          src={product.coverImage || FALLBACK_IMAGE}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Информация */}
      <div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <p className="text-gray-600 mb-6">
          {product.description || "Описание отсутствует"}
        </p>

        {/* Цена */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl font-bold text-green-700">
            {(newPrice / 100).toFixed(2)} ₽
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through">
              {(oldPrice / 100).toFixed(2)} ₽
            </span>
          )}
        </div>

        {/* Выбор количества */}
        {product.stock > 0 ? (
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={decrease}
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={quantity <= 1}
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val >= 1 && val <= product.stock) setQuantity(val);
              }}
              className="w-16 text-center border rounded"
            />
            <button
              onClick={increase}
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={quantity >= product.stock}
            >
              +
            </button>
            <span className="text-sm text-gray-500">
              В наличии: {product.stock} шт.
            </span>
          </div>
        ) : (
          <p className="text-red-600 mb-6">Нет в наличии</p>
        )}

        {/* Кнопка */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 w-full md:w-auto disabled:opacity-50"
        >
          Добавить в корзину
        </button>
      </div>
    </div>
  );
}
