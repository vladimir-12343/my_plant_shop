"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCart } from "@/components/CartContext"

type CartItem = {
  id: number
  name: string
  price: number // в копейках
  quantity: number
  stock?: number | null
  coverImage?: string | null
}

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

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "RUB",
        minimumFractionDigits: 2,
      }),
    []
  )

  const total = cart.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)

  const increase = (id: number) => {
    const product = cart.find((i: CartItem) => i.id === id)
    if (!product) return
    const max = product.stock ?? 0
    if (max <= 0 || product.quantity < max) {
      // предполагаем, что addToCart умеет работать с дельтой quantity
      addToCart({ ...product, quantity: 1 })
    }
  }

  const decrease = (id: number) => {
    const product = cart.find((i: CartItem) => i.id === id)
    if (!product) return
    if (product.quantity > 1) {
      addToCart({ ...product, quantity: -1 })
    } else {
      removeFromCart(id)
    }
  }

  // Оформление заказа
  // Оформление заказа
const handleCheckout = async () => {
  if (!cart.length || loading) return
  setLoading(true)
  try {
    const products = cart.map((item: CartItem) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }))

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products, total }),
      credentials: "include", // 👈 отправляем сессионную куку NextAuth
    })

    if (res.status === 401) {
      // не авторизован → закрываем корзину и на логин
      setCartOpen(false)
      router.push("/login?callbackUrl=/thank-you") // или ваш нужный callbackUrl
      return
    }

    if (res.ok) {
      clearCart()
      setCartOpen(false)
      router.push("/thank-you")
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err?.error || "Ошибка при оформлении заказа")
    }
  } catch (e) {
    console.error(e)
    alert("Ошибка сервера")
  } finally {
    setLoading(false)
  }
}

  // Закрытие по Esc + блокируем прокрутку фона, когда открыт дроуэр
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false)
    }
    if (isCartOpen) {
      document.addEventListener("keydown", onKey)
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.removeEventListener("keydown", onKey)
        document.body.style.overflow = prev
      }
    }
  }, [isCartOpen, setCartOpen])

  const close = () => setCartOpen(false)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Корзина"
      className={`fixed inset-0 z-50 transition ${
        isCartOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Затемнение фона */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          isCartOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={close}
      />

      {/* Панель */}
      <aside
        className={`absolute right-0 top-0 h-full w-96 max-w-[92vw] bg-white shadow-xl transform transition-transform duration-500 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-bold text-lg">Корзина</h2>
          <button
            onClick={close}
            className="text-gray-500 hover:text-black"
            aria-label="Закрыть корзину"
          >
            ✕
          </button>
        </div>

        {/* Список товаров */}
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-160px)]">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-center">Корзина пуста</p>
          ) : (
            cart.map((item: CartItem) => {
              const price = item.price / 100
              const canIncrease =
                (item.stock ?? 0) === 0 ? true : item.quantity < (item.stock ?? 0)

              return (
                <div key={item.id} className="flex gap-3 items-center">
                  {/* Фото */}
                  <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden">
                    <Image
                      src={item.coverImage || "/images/placeholder-product.jpg"}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  {/* Инфо */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    <p className="text-sm text-gray-600">{currency.format(price)}</p>

                    {/* Количество */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => decrease(item.id)}
                        className="px-2 py-0.5 border rounded hover:bg-gray-100"
                        aria-label="Убавить количество"
                      >
                        -
                      </button>
                      <span aria-live="polite">{item.quantity}</span>
                      <button
                        onClick={() => increase(item.id)}
                        disabled={!canIncrease}
                        className="px-2 py-0.5 border rounded hover:bg-gray-100 disabled:opacity-50"
                        aria-label="Прибавить количество"
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-500">
                        {item.stock != null ? `${item.stock} шт. в наличии` : "В наличии"}
                      </span>
                    </div>
                  </div>

                  {/* Удалить */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-600 hover:underline text-sm"
                    aria-label={`Удалить ${item.name} из корзины`}
                  >
                    Удалить
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Итог + кнопки */}
        {cart.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between font-bold mb-4">
              <span>Итого:</span>
              <span>{currency.format(total / 100)}</span>
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
      </aside>
    </div>
  )
}
