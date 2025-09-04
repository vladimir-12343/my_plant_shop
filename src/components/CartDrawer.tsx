"use client"

import { useState } from "react"
import Image from "next/image"
import { useCart } from "@/components/CartContext"
import { useRouter } from "next/navigation"

export default function CartDrawer() {
  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    isCartOpen,
    setCartOpen,
  } = useCart()

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const increase = (id: number) => {
    const product = cart.find((i) => i.id === id)
    if (product && product.quantity < (product.stock ?? 0)) {
      addToCart({ ...product, quantity: 1 }) // прибавляем 1
    }
  }

  const decrease = (id: number) => {
    const product = cart.find((i) => i.id === id)
    if (product && product.quantity > 1) {
      addToCart({ ...product, quantity: -1 }) // убавляем 1
    } else {
      removeFromCart(id) // удаляем если стало 0
    }
  }

  // 📌 оформление заказа
  const handleCheckout = async () => {
    setLoading(true)

    try {
      const products = cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }))

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products,
          total,
        }),
      })

      if (res.ok) {
        clearCart()
        setCartOpen(false)
        router.push("/thank-you")
      } else {
        const err = await res.json()
        alert(err.error || "Ошибка при оформлении заказа")
      }
    } catch (err) {
      console.error(err)
      alert("Ошибка сервера")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        isCartOpen ? "visible" : "invisible"
      }`}
    >
      {/* затемнение фона */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setCartOpen(false)}
      />

      {/* панель */}
      <div
        className={`absolute right-0 top-0 h-full w-96 bg-white shadow-xl transform transition-transform duration-500 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold text-lg">Корзина</h2>
          <button
            onClick={() => setCartOpen(false)}
            className="text-gray-500 hover:text-black"
          >
            ✕
          </button>
        </div>

        {/* Список товаров */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-160px)]">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center">Корзина пуста</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex gap-3 items-center">
                {/* фото */}
                <div className="relative w-16 h-16 bg-gray-100 rounded">
                  <Image
                    src={item.coverImage || "/images/placeholder-product.jpg"}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                  />
                </div>

                {/* инфо */}
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {(item.price / 100).toFixed(2)} ₽
                  </p>

                  {/* количество */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => decrease(item.id)}
                      className="px-2 py-0.5 border rounded hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => increase(item.id)}
                      disabled={item.quantity >= (item.stock ?? 0)}
                      className="px-2 py-0.5 border rounded hover:bg-gray-100 disabled:opacity-50"
                    >
                      +
                    </button>
                    <span className="text-xs text-gray-500">
                      {item.stock} шт. в наличии
                    </span>
                  </div>
                </div>

                {/* удалить */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Удалить
                </button>
              </div>
            ))
          )}
        </div>

        {/* Итог + кнопки */}
        {cart.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between font-bold mb-4">
              <span>Итого:</span>
              <span>{(total / 100).toFixed(2)} ₽</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-green-700 text-white py-2 rounded hover:bg-green-800 mb-2 disabled:opacity-50"
            >
              {loading ? "Отправка..." : "Оформить заказ"}
            </button>
            <button
              onClick={clearCart}
              className="w-full text-red-600 border border-red-600 py-2 rounded hover:bg-red-50"
            >
              Очистить корзину
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
