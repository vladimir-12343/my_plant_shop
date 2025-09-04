"use client"

import { useState } from "react"

export default function AddressForm({ user }: { user: any }) {
  const [country, setCountry] = useState(user?.country || "")
  const [address, setAddress] = useState(user?.address || "")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")

    const res = await fetch("/api/account/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, address }),
    })

    if (res.ok) {
      setMessage("✅ Адрес успешно сохранён")
    } else {
      setMessage("❌ Ошибка сохранения")
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
        className="w-full bg-[#c7a17a] hover:bg-[#b8926d] text-white py-2 rounded transition"
      >
        Сохранить адрес
      </button>
      {message && <p className="text-sm text-gray-600">{message}</p>}
    </form>
  )
}
