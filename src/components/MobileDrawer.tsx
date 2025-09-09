'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type NavItem = { label: string; href: string }

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  pathname: string
  shopItems: NavItem[] // подпункты «Магазин»
}

export default function MobileDrawer({ open, onClose, pathname, shopItems }: MobileDrawerProps) {
  const [openShop, setOpenShop] = useState(false)
  const [openPolicy, setOpenPolicy] = useState(false)

  // блокируем прокрутку страницы, когда меню открыто
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // закрытие по Esc
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onClose])

  const LinkItem = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link
      href={href}
      onClick={onClose}
      className={`block uppercase tracking-[0.25em] text-base py-4 pl-6 pr-4 ${
        pathname === href ? 'text-white' : 'text-white/90'
      } hover:text-white`}
    >
      {children}
    </Link>
  )

  return (
    <div aria-hidden={!open} className={`fixed inset-0 z-[60] transition-all ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* подложка */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* панель */}
      <aside
        role="dialog"
        aria-modal="true"
        className={`absolute left-0 top-0 h-full w-[88%] max-w-sm bg-neutral-800 text-white shadow-xl
                    transition-transform duration-300 ease-out
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* шапка */}
        <div className="flex items-center justify-between px-5 py-4">
          <span className="uppercase tracking-[0.25em] text-sm">Меню</span>
          <button aria-label="Закрыть меню" onClick={onClose} className="p-2 text-white/80 hover:text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mx-6 h-px bg-white/10" />

        {/* список */}
        <nav className="overflow-y-auto h-[calc(100%-140px)] pb-6">
          <LinkItem href="/">Главная</LinkItem>
          <div className="mx-6 h-px bg-white/10" />

          {/* Магазин с раскрытием */}
          <button
            className="w-full flex items-center justify-between py-4 pl-6 pr-4 uppercase tracking-[0.25em] text-base text-white/90 hover:text-white"
            onClick={() => setOpenShop((v) => !v)}
            aria-expanded={openShop}
          >
            <span>Магазин</span>
            <span className={`transition-transform ${openShop ? 'rotate-45' : ''}`} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          {openShop && (
            <div className="pb-2">
              {shopItems.map((it) => (
                <Link
                  key={it.label}
                  href={it.href}
                  onClick={onClose}
                  className="block pl-10 pr-4 py-3 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white"
                >
                  {it.label}
                </Link>
              ))}
            </div>
          )}
          <div className="mx-6 h-px bg-white/10" />

          <LinkItem href="/reviews">Отзывы</LinkItem>
          <div className="mx-6 h-px bg-white/10" />

          {/* Политика с раскрытием (пример подпунктов) */}
          <button
            className="w-full flex items-center justify-between py-4 pl-6 pr-4 uppercase tracking-[0.25em] text-base text-white/90 hover:text-white"
            onClick={() => setOpenPolicy((v) => !v)}
            aria-expanded={openPolicy}
          >
            <span>Политика</span>
            <span className={`transition-transform ${openPolicy ? 'rotate-45' : ''}`} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          {openPolicy && (
            <div className="pb-2">
              <Link href="/policy" onClick={onClose} className="block pl-10 pr-4 py-3 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white">
                Доставка и возврат
              </Link>
              <Link href="/policy/terms" onClick={onClose} className="block pl-10 pr-4 py-3 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white">
                Условия
              </Link>
            </div>
          )}
          <div className="mx-6 h-px bg-white/10" />

          <LinkItem href="/wholesale">Опт</LinkItem>
          <div className="mx-6 h-px bg-white/10" />

          <LinkItem href="/rehab">Реабилитация</LinkItem>
          <div className="mx-6 h-px bg-white/10" />

          <LinkItem href="/orders">Заказы</LinkItem>

          {/* Аккаунт */}
          <div className="mt-4">
            <Link
              href="/account"
              onClick={onClose}
              className="block pl-6 pr-4 py-3 text-sm uppercase tracking-[0.2em] text-white/80 hover:text-white"
            >
              Account
            </Link>
          </div>
        </nav>

        {/* подвал с иконками */}
        <div className="mt-auto px-6 py-4">
          <div className="mx-6 h-px bg-white/10 mb-4" />
          <div className="flex items-center gap-6 text-white/80">
            <a href="https://facebook.com" aria-label="Facebook" className="hover:text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v3H8v3h3v6h3v-6h3l1-3h-4v-3c0-.6.4-1 1-1Z" />
              </svg>
            </a>
            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" />
              </svg>
            </a>
          </div>
        </div>
      </aside>
    </div>
  )
}
