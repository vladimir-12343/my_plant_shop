'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Product = { 
  id: number
  name: string
  price: number // в копейках
  discount?: number | null
  coverImage?: string | null 
}
type ApiRes = { products: Product[]; total: number; pages: Array<{ title: string; href: string }> }

export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState<ApiRes>({ products: [], total: 0, pages: [] })
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => inputRef.current?.focus(), 50)
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onEsc)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onEsc)
    }
  }, [open, onClose])

  const debouncedQ = useMemo(() => q, [q])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const query = debouncedQ.trim()
      if (query.length < 2) {
        setRes({ products: [], total: 0, pages: [] })
        setError(null)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const r = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=12`, {
          signal: controller.signal,
        })
        if (!r.ok) throw new Error('Ошибка поиска')
        const data: ApiRes = await r.json()
        setRes(data)
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError('Не удалось выполнить поиск')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [debouncedQ, open])

  const submitFull = () => {
    const query = q.trim()
    if (query.length === 0) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
    onClose()
  }

  const formatPrice = (value: number) =>
    Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)

  return (
    <div className={`fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`}>
      {/* фон снизу */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* панель сверху */}
      <div
        className={`absolute left-0 right-0 top-0 h-[80vh] bg-white rounded-b-2xl shadow-lg transition-transform duration-300 ease-out
        ${open ? 'translate-y-0' : '-translate-y-3 opacity-0'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* поиск */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-500">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitFull()}
              placeholder="Поиск товаров…"
              className="w-full outline-none text-lg sm:text-xl placeholder:text-gray-400"
            />
          </div>
          <button
            aria-label="Закрыть"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-800"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" stroke="currentColor" fill="none">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="border-t border-gray-100" />

        {/* контент */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto h-[calc(70vh-60px)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="text-xs tracking-[0.25em] uppercase text-gray-500">
              {q.trim().length < 2
                ? 'Введите минимум 2 символа'
                : `${res.total} результатов`}
            </div>
            <div className="text-right">
              {q.trim().length >= 2 && (
                <button
                  onClick={submitFull}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Смотреть все →
                </button>
              )}
            </div>
          </div>

          {error && <div className="text-red-600">{error}</div>}

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          )}

          {!loading && q.trim().length >= 2 && res.products.length === 0 && (
            <div className="text-gray-500">Ничего не найдено</div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {res.products.map((p) => {
              const oldPrice = p.price / 100
              const newPrice = p.discount ? oldPrice * (1 - p.discount / 100) : oldPrice

              return (
                <Link
                  key={p.id}
                  href={`/shop/${p.id}`}
                  onClick={onClose}
                  className="group"
                >
                  <div className="aspect-square bg-white rounded-xl overflow-hidden border border-gray-200">
                    {p.coverImage ? (
                      <Image
                        src={p.coverImage}
                        alt={p.name}
                        width={600}
                        height={600}
                        className="h-full w-full object-contain group-hover:scale-[1.02] transition"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-gray-400 text-sm">
                        без изображения
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-xs tracking-[0.2em] uppercase line-clamp-2 text-gray-800">
                    {p.name}
                  </div>
                  <div className="mt-2 text-lg font-bold text-green-700">
                    {p.discount ? (
                      <>
                        <span className="mr-2">{formatPrice(newPrice)}</span>
                        <span className="line-through text-gray-400 text-sm">
                          {formatPrice(oldPrice)}
                        </span>
                      </>
                    ) : (
                      formatPrice(oldPrice)
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
