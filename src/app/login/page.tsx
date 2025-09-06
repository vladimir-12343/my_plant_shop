"use client"

import { signIn, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const errorParam = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      if (session.user.role === "ADMIN") {
        router.replace("/admin/products")
      } else {
        router.replace("/account")
      }
    }
  }, [status, session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl: "/account",
    })

    if (res?.error) {
      console.error("Ошибка входа:", res.error)
      setError("Неверный email или пароль")
      setLoading(false)
      return
    }

    if (res?.url) {
      router.push(res.url)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-wide mb-2">
          LOGIN
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Please enter your e-mail and password:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            placeholder="Email"
          />
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            placeholder="Password"
          />

          {(error || errorParam) && (
            <p className="text-sm text-red-600">
              {error || "Неверный email или пароль"}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#c7a17a] hover:bg-[#b8926d] text-white py-2 font-medium transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>
        </form>

        {/* 👇 Добавляем переход на регистрацию */}
        <p className="mt-6 text-center text-sm text-gray-600">
          Нет аккаунта?{" "}
          <a href="/register" className="text-[#c7a17a] hover:underline">
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  )
}
