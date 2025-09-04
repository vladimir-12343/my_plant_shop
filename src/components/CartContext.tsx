"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface CartItem {
  id: number
  name: string
  price: number
  coverImage?: string | null
  quantity: number
  stock: number        // 👈 добавили сюда
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setCartOpen] = useState(false)

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        const newQty = existing.quantity + item.quantity
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: Math.min(newQty, i.stock) } // 👈 ограничиваем по складу
            : i
        )
      }
      // при первом добавлении тоже ограничиваем
      return [...prev, { ...item, quantity: Math.min(item.quantity, item.stock) }]
    })
  }

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.id !== id))
  }

  const clearCart = () => setCart([])

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        setCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
