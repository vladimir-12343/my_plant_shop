"use client"

import { useEffect, useMemo, useState, useCallback } from "react"

// ---------- Типы ----------
type Status = "NEW" | "IN_PROGRESS" | "READY" | "CANCELLED"

// ---------- Константы статусов ----------
const STATUSES: Record<Status, { label: string; color: string }> = {
  NEW: { label: "Новые", color: "bg-yellow-50 border-yellow-200" },
  IN_PROGRESS: { label: "В работе", color: "bg-blue-50 border-blue-200" },
  READY: { label: "Готовые", color: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Отменённые", color: "bg-red-50 border-red-200" },
}

const FLOW: Status[] = ["NEW", "IN_PROGRESS", "READY", "CANCELLED"]

const nextOf = (s: Status): Status =>
  FLOW[Math.min(FLOW.indexOf(s) + 1, FLOW.length - 1)]!

const prevOf = (s: Status): Status =>
  FLOW[Math.max(FLOW.indexOf(s) - 1, 0)]!

// ==== Иконки (inline SVG) ====
const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0z"/></svg>
)
const IconX = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
)

// Бейдж статуса
function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    NEW: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    READY: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>
      {STATUSES[status].label}
    </span>
  )
}

// === Упрощённый список заказов (без канбана) ===
function AdminOrdersKanban({ orders }: { orders: any[] | undefined }) {
  const [localOrders, setLocalOrders] = useState<any[]>(() => orders ?? [])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL")

  // Приходят новые пропсы — синхронизируем
  useEffect(() => setLocalOrders(orders ?? []), [orders])

  // Быстрое локальное обновление + синхронизация открытой модалки
  const applyLocalUpdate = useCallback((orderId: number, patch: Partial<any>) => {
    setLocalOrders(prev => (prev ?? []).map(o => (o.id === orderId ? { ...o, ...patch } : o)))
    setSelectedOrder((prev: { id: number; }) => (prev && prev.id === orderId ? { ...prev, ...patch } : prev))
  }, [])

  // PATCH статуса на сервере + обновление локального состояния
  const patchStatus = useCallback(async (orderId: number, newStatus: Status) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        console.error("Ошибка при обновлении заказа:", await res.text())
        return
      }
      const updatedOrder = await res.json()
      setLocalOrders(prev => (prev ?? []).map(o => (o.id === orderId ? updatedOrder : o)))
      setSelectedOrder((prev: { id: number; }) => (prev && prev.id === orderId ? updatedOrder : prev))
    } catch (e) {
      console.error("Ошибка сети:", e)
    }
  }, [])

  // Поиск + фильтрация
  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    const base = statusFilter === "ALL"
      ? (localOrders ?? [])
      : (localOrders ?? []).filter(o => (o.status ?? "NEW") === statusFilter)

    return base.filter(o => {
      if (!q) return true
      const idHit = String(o.id).includes(q)
      const emailHit = (o.user?.email || "").toLowerCase().includes(q)
      const nameHit = ((o.user?.firstName || "") + " " + (o.user?.lastName || "")).toLowerCase().includes(q)
      const productsHit = Array.isArray(o.products)
        ? (o.products as any[]).some(p => (p?.name || "").toLowerCase().includes(q))
        : false
      return idHit || emailHit || nameHit || productsHit
    })
  }, [localOrders, q, statusFilter])

  // Счётчики по статусам (для подсказки пользователю)
  const counts = useMemo(() => {
    const c: Record<Status, number> = { NEW: 0, IN_PROGRESS: 0, READY: 0, CANCELLED: 0 }
    for (const o of localOrders ?? []) c[(o.status ?? "NEW") as Status]++
    return c
  }, [localOrders])

  return (
    <>
      {/* Верхняя панель: Поиск + один селект для выбора статуса */}
      <div className="px-2 mb-3 flex flex-col gap-2">
        <div className="relative w-full">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск: #id, e-mail, имя или товар…"
            className="w-full rounded-xl border px-9 py-2 bg-white outline-none focus:ring-4 focus:ring-black/5"
            inputMode="search"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
              aria-label="Очистить"
            >
              <IconX className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border px-3 py-2 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | "ALL")}
          >
            <option value="ALL">Все статусы</option>
            {(Object.keys(STATUSES) as Status[]).map(st => (
              <option key={st} value={st}>{STATUSES[st].label} {counts[st] ? `(${counts[st]})` : ""}</option>
            ))}
          </select>
          {/* Подсказка-счётчики (не кликабельные) */}
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            {(Object.keys(STATUSES) as Status[]).map(st => (
              <span key={st} className="inline-flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full border" />
                {STATUSES[st].label}: {counts[st]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Список заказов */}
      <div className="px-2 space-y-3">
        {filtered.length === 0 && (
          <div className="text-sm text-gray-500 py-8 text-center border rounded-xl bg-white">Ничего не найдено</div>
        )}

        {filtered.map((order) => (
          <button
            key={order.id}
            onClick={() => setSelectedOrder(order)}
            className="w-full text-left p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold leading-tight truncate">Заказ #{order.id}</p>
                <p className="text-sm text-gray-600 truncate">{order.user?.firstName} {order.user?.lastName} · {order.user?.email}</p>
              </div>
              <StatusBadge status={(order.status ?? "NEW") as Status} />
            </div>
            <div className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
          </button>
        ))}
      </div>

      {/* Модалка с деталями + смена статуса */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-3">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-3 right-3 text-gray-500 hover:text-black" aria-label="Закрыть">
              <IconX className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold mb-1">Заказ #{selectedOrder.id}</h2>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}</span>
              <StatusBadge status={(selectedOrder.status ?? "NEW") as Status} />
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Клиент</span>
                <span className="font-medium text-right truncate">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-right break-all">{selectedOrder.user?.email}</span>
              </div>
            </div>

            {/* Быстрая смена статуса */}
            <div className="mt-4 flex items-center gap-2">
              <select
                className="rounded-lg border px-3 py-2 text-sm bg-white"
                value={(selectedOrder.status ?? "NEW") as Status}
                onChange={async (e) => {
                  const value = e.target.value as Status
                  await patchStatus(selectedOrder.id, value)
                  applyLocalUpdate(selectedOrder.id, { status: value })
                }}
              >
                {(Object.keys(STATUSES) as Status[]).map(st => (
                  <option key={st} value={st}>{STATUSES[st].label}</option>
                ))}
              </select>
              <button
                onClick={async () => { const prev = prevOf((selectedOrder.status ?? "NEW") as Status); await patchStatus(selectedOrder.id, prev); applyLocalUpdate(selectedOrder.id, { status: prev }) }}
                className="rounded-lg border px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
              >
                ← Назад
              </button>
              <button
                onClick={async () => { const next = nextOf((selectedOrder.status ?? "NEW") as Status); await patchStatus(selectedOrder.id, next); applyLocalUpdate(selectedOrder.id, { status: next }) }}
                className="rounded-lg border px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
              >
                Вперёд →
              </button>
            </div>

            <h3 className="font-semibold mt-6 mb-2">Состав заказа</h3>
            <ul className="space-y-2 text-sm max-h-[40vh] overflow-y-auto pr-1">
              {(selectedOrder.products as any[])?.map((p, i) => (
                <li key={i} className="flex justify-between border-b pb-1 text-gray-700">
                  <span className="break-words break-all">{p.name} × {p.quantity}</span>
                  <span>{((p.price * p.quantity) / 100).toFixed(2)} ₽</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminOrdersKanban;
