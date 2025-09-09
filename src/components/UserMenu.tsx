"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function UserMenu() {
  const { data: session, status } = useSession()

  const [isHoverEnabled, setIsHoverEnabled] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<NodeJS.Timeout | null>(null) // 👈 таймер закрытия

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setIsHoverEnabled(mq.matches)
    update()
    if (mq.addEventListener) mq.addEventListener("change", update)
    else mq.addListener(update)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update)
      else mq.removeListener(update)
    }
  }, [])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false)
        setHovered(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  if (status === "loading") return <span>...</span>

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="p-2 hover:text-gray-900"
        aria-label="Войти"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </button>
    )
  }

  const menuVisible = isHoverEnabled ? hovered : open

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => {
        if (isHoverEnabled) {
          if (closeTimer.current) clearTimeout(closeTimer.current)
          setHovered(true)
        }
      }}
      onMouseLeave={() => {
        if (isHoverEnabled) {
          closeTimer.current = setTimeout(() => setHovered(false), 250) // 👈 задержка 250 мс
        }
      }}
    >
      <button
        onClick={() => { if (!isHoverEnabled) setOpen(v => !v) }}
        className="p-2 hover:text-gray-900"
        aria-haspopup="menu"
        aria-expanded={menuVisible}
        aria-label="Аккаунт"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      </button>

      {menuVisible && (
        <div className="absolute right-0 mt-2 bg-white shadow-md rounded-lg p-2 min-w-[160px] z-50">
          <ul className="space-y-1">
            {session.user.role === "USER" && (
              <li>
                <Link href="/account" className="block px-3 py-1 hover:bg-gray-50"
                      onClick={() => { setOpen(false); setHovered(false) }}>
                  Аккаунт
                </Link>
              </li>
            )}
            {session.user.role === "ADMIN" && (
              <li>
                <Link href="/admin/products" className="block px-3 py-1 hover:bg-gray-50"
                      onClick={() => { setOpen(false); setHovered(false) }}>
                  Админ панель
                </Link>
              </li>
            )}
            <li>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="block w-full text-left px-3 py-1 hover:bg-gray-50"
              >
                Выйти
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
