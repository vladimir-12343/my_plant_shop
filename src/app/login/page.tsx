"use client"

import { signIn, getSession } from "next-auth/react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // ⚡️ логинимся без авто-редиректа
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    })

    if (res?.error) {
      console.error("Ошибка входа:", res.error)
      return
    }

    // ⚡️ получаем сессию и проверяем роль
    const session = await getSession()

    if (session?.user?.role === "ADMIN") {
      router.push("/admin/products")
    } else {
      router.push("/account")
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

          {error && (
            <p className="text-sm text-red-600">Invalid email or password</p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-[#c7a17a] hover:bg-[#b8926d] text-white py-2 font-medium transition"
          >
            LOGIN
          </button>
        </form>
      </div>
    </div>
  )
}
