"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState, useRef, forwardRef } from "react"
import MegaMenu from "@/components/MegaMenu"
import { useCart } from "@/components/CartContext"

const SHOP_SECTIONS = [
  {
    title: "Категории",
    items: [
      { label: "Все растения", href: "/shop/all-plants" },
      { label: "Аглаонема", href: "#" },
      { label: "Алоказия", href: "#" },
      { label: "Антуриум", href: "#" },
      { label: "Монстера", href: "#" },
      { label: "Филодендрон", href: "#" },
      { label: "Сингониум", href: "#" },
      { label: "Другое", href: "#" },
    ],
  },
  {
    title: "Специальное",
    items: [
      { label: "Новинки", href: "#" },
      { label: "Хит продаж", href: "#" },
      { label: "Скидки", href: "#" },
      { label: "Флеш-распродажа", href: "#" },
    ],
  },
  {
    title: "Мерч",
    items: [
      { label: "Скелет листа", href: "#" },
      { label: "Футболка", href: "#" },
    ],
  },
  {
    title: "Редкие растения",
    items: [
      { label: "Все редкие", href: "#" },
      { label: "Редкие антуриумы", href: "#" },
      { label: "Редкие монстеры", href: "#" },
    ],
  },
]

// ⬇️ forwardRef позволяет RootLayout получить высоту Header
const Header = forwardRef<HTMLElement>((props, ref) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [auth, setAuth] = useState<{ admin: boolean; userEmail: string | null }>({
    admin: false,
    userEmail: null,
  })
  const menuRef = useRef<HTMLDivElement>(null)

  const { cart, setCartOpen } = useCart()
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    let alive = true
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return
        setAuth({ admin: !!data.admin, userEmail: data.userEmail || null })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const renderAccountMenu = () => {
    if (auth.admin) {
      return (
        <>
          <Link href="/admin/products" className="block px-4 py-2 hover:bg-gray-50">
            Админ панель
          </Link>
          <Link href="/logout" className="block px-4 py-2 hover:bg-gray-50">
            Выйти
          </Link>
        </>
      )
    }
    if (auth.userEmail) {
      return (
        <>
          <Link href="/account" className="block px-4 py-2 hover:bg-gray-50">
            Личный кабинет
          </Link>
          <Link href="/logout" className="block px-4 py-2 hover:bg-gray-50">
            Выйти
          </Link>
        </>
      )
    }
    return (
      <Link href="/login" className="block px-4 py-2 hover:bg-gray-50">
        Войти
      </Link>
    )
  }

  return (
    <header ref={ref} className="fixed top-0 left-0 w-full z-50 bg-white shadow">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12">
        {/* desktop */}
        <div className="hidden md:flex items-center justify-between py-5 lg:py-0">
          {/* Лого */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="BloomPlace"
                width={120}
                height={120}
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Навигация */}
          <nav className="flex-1 flex justify-center px-2 sm:px-4 md:px-6 lg:px-8">
            <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
              <li>
                <Link
                  href="/"
                  className={`uppercase text-xs tracking-[0.25em] ${
                    pathname === "/" ? "text-gray-900" : "text-gray-700"
                  } hover:text-gray-900`}
                >
                  Главная
                </Link>
              </li>
              <li>
                <MegaMenu
                  label="Магазин"
                  sections={SHOP_SECTIONS}
                  image={{
                    src: "/images/rare-plants.png",
                    alt: "Редкие растения",
                    caption: "Откройте для себя редкие растения",
                  }}
                  className="uppercase text-xs tracking-[0.25em] hover:text-gray-900"
                />
              </li>
              <li><Link href="/reviews" className="uppercase text-xs tracking-[0.25em] hover:text-gray-900">Отзывы</Link></li>
              <li><Link href="/policy" className="uppercase text-xs tracking-[0.25em] hover:text-gray-900">Политика</Link></li>
              <li><Link href="/wholesale" className="uppercase text-xs tracking-[0.25em] hover:text-gray-900">Опт</Link></li>
              <li><Link href="/rehab" className="uppercase text-xs tracking-[0.25em] hover:text-gray-900">Реабилитация</Link></li>
              <li><Link href="/orders" className="uppercase text-xs tracking-[0.25em] hover:text-gray-900">Заказы</Link></li>
            </ul>
          </nav>

          {/* Иконки справа */}
          <div className="flex items-center gap-6 text-gray-700">
            {/* Аккаунт */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="hover:text-gray-900 relative top-1"
                aria-label="Аккаунт"
              >
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeWidth="1.8" strokeLinecap="round" d="M20 21a8 8 0 10-16 0" />
                  <circle cx="12" cy="7" r="4" strokeWidth="1.8" />
                </svg>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg py-2 z-50">
                  {renderAccountMenu()}
                </div>
              )}
            </div>

            {/* Поиск */}
            <Link href="/search" className="hover:text-gray-900" aria-label="Поиск">
              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
                <path d="M20 20l-3.5-3.5" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </Link>

            {/* Корзина */}
            {!auth.admin && (
              <button
                onClick={() => setCartOpen(true)}
                className="hover:text-gray-900 relative"
                aria-label="Корзина"
              >
                <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 6h15l-2 9H8L6 6Z" strokeWidth="1.8" />
                  <circle cx="9" cy="20" r="1.5" />
                  <circle cx="18" cy="20" r="1.5" />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* mobile */}
        <div className="flex md:hidden items-center justify-between py-4">
          {/* Лого */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="BloomPlace"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </Link>

          {/* Бургер */}
          <button
            onClick={() => setOpen(!open)}
            className="text-gray-700 hover:text-gray-900"
            aria-label="Меню"
          >
            {open ? (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* мобильное меню */}
        {open && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg z-50">
            <ul className="flex flex-col p-4 space-y-4">
              <li><Link href="/" className="uppercase text-sm hover:text-gray-900">Главная</Link></li>
              <li><Link href="/shop/all-plants" className="uppercase text-sm hover:text-gray-900">Магазин</Link></li>
              <li><Link href="/reviews" className="uppercase text-sm hover:text-gray-900">Отзывы</Link></li>
              <li><Link href="/policy" className="uppercase text-sm hover:text-gray-900">Политика</Link></li>
              <li><Link href="/wholesale" className="uppercase text-sm hover:text-gray-900">Опт</Link></li>
              <li><Link href="/rehab" className="uppercase text-sm hover:text-gray-900">Реабилитация</Link></li>
              <li><Link href="/orders" className="uppercase text-sm hover:text-gray-900">Заказы</Link></li>
            </ul>
          </div>
        )}
      </div>
    </header>
  )
})

Header.displayName = "Header"
export default Header
