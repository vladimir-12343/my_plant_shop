"use client"

import { useState } from "react"

export default function AddressForm({ user }: { user: any }) {
  const [country, setCountry] = useState(user?.country || "")
  const [address, setAddress] = useState(user?.address || "")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/account/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, address }),
      })

      const data = await res.json()

      if (res.status === 401) {
        setMessage("⚠️ Сессия истекла, войдите заново")
        window.location.href = "/login"
        return
      }

      if (!res.ok) {
        setMessage(data.error || "❌ Ошибка сохранения")
        return
      }

      setMessage("✅ Адрес успешно сохранён")
    } catch (err) {
      console.error(err)
      setMessage("❌ Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <input
        type="text"
        placeholder="Страна"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        type="text"
        placeholder="Адрес"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#c7a17a] hover:bg-[#b8926d] text-white py-2 rounded transition disabled:opacity-60"
      >
        {loading ? "Сохраняю..." : "Сохранить адрес"}
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  )
}
