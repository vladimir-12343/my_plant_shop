"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import Link from "next/link"

export default function UserMenu() {
  const { data: session, status } = useSession()

  if (status === "loading") return <span>...</span>

  // Не авторизован
  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="p-2 hover:text-gray-900"
        aria-label="Войти"
      >
        {/* иконка человечка (контурная) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z"
          />
        </svg>
      </button>
    )
  }

  // Авторизован
  return (
    <div className="relative group">
      <button className="p-2 hover:text-gray-900" aria-label="Аккаунт">
        {/* 👇 та же иконка, что и у неавторизованного */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z"
          />
        </svg>
      </button>

      <div className="absolute right-0 hidden group-hover:block bg-white shadow-md rounded-lg p-2">
        <ul className="space-y-1">
          {session.user.role === "USER" && (
            <li>
              <Link
                href="/account"
                className="block px-3 py-1 hover:bg-gray-50"
              >
                Аккаунт
              </Link>
            </li>
          )}

          {session.user.role === "ADMIN" && (
            <li>
              <Link
                href="/admin/products"
                className="block px-3 py-1 hover:bg-gray-50"
              >
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
    </div>
  )
}
