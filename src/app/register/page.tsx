"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function RegisterPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || "Ошибка регистрации")
    } else {
      // ✅ сразу авторизуем через next-auth
      const loginRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: "/account", // fallback
      })

      if (loginRes?.error) {
        setError("Аккаунт создан, но вход не удался. Попробуйте войти вручную.")
        router.push("/login")
      } else if (loginRes?.url) {
        router.push(loginRes.url) // /account или /admin/products
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-wide mb-2">
          РЕГИСТРАЦИЯ
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Пожалуйста, заполните форму ниже:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Имя"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />

          <input
            type="text"
            placeholder="Фамилия"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />

          <input
            type="email"
            placeholder="Электронная почта"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />

          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#c7a17a] hover:bg-[#b8926d] text-white py-2 font-medium transition disabled:opacity-60"
          >
            {loading ? "Создание..." : "СОЗДАТЬ АККАУНТ"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Уже есть аккаунт?{" "}
          <a href="/login" className="text-[#c7a17a] hover:underline">
            Войти
          </a>
        </p>
      </div>
    </div>
  )
}
