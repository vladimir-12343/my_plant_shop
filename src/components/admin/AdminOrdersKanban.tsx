"use client"

import { useEffect, useRef, useState, useLayoutEffect, useMemo, useCallback } from "react"

type Status = "NEW" | "IN_PROGRESS" | "READY" | "CANCELLED"

const STATUSES: Record<Status, { label: string; color: string }> = {
  NEW: { label: "Новые", color: "bg-yellow-50 border-yellow-200" },
  IN_PROGRESS: { label: "В работе", color: "bg-blue-50 border-blue-200" },
  READY: { label: "Готовые", color: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Отменённые", color: "bg-red-50 border-red-200" },
}

const MOBILE_FLOW: Status[] = ["NEW", "IN_PROGRESS", "READY", "CANCELLED"]

const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0z"/></svg>
)
const IconX = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12"/></svg>
)

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

export default function AdminOrdersKanban({ orders }: { orders: any[] | undefined }) {
  const [localOrders, setLocalOrders] = useState<any[]>(() => orders ?? [])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL")

  useEffect(() => setLocalOrders(orders ?? []), [orders])

  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches
      setIsMobile(isCoarse || window.innerWidth < 768)
      const onResize = () => setIsMobile(window.matchMedia?.("(pointer: coarse)")?.matches || window.innerWidth < 768)
      window.addEventListener("resize", onResize)
      return () => window.removeEventListener("resize", onResize)
    }
  }, [])

  const boardRef = useRef<HTMLDivElement>(null)
  const [boardHeight, setBoardHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    const compute = () => {
      const el = boardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const bottomGap = 12
      const h = Math.max(360, Math.floor(vh - rect.top - bottomGap))
      setBoardHeight(h)
    }
    compute()
    window.addEventListener("resize", compute)
    const ro = new ResizeObserver(() => compute())
    ro.observe(document.body)
    return () => {
      window.removeEventListener("resize", compute)
      ro.disconnect()
    }
  }, [])

  const colRefs = useRef<Record<Status, HTMLDivElement | null>>({ NEW: null, IN_PROGRESS: null, READY: null, CANCELLED: null })
  const scrollToStatus = (status: Status) => {
    const el = colRefs.current[status]
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
  }

  const applyLocalUpdate = useCallback((orderId: number, patch: Partial<any>) => {
    setLocalOrders(prev => (prev ?? []).map(o => (o.id === orderId ? { ...o, ...patch } : o)))
    setSelectedOrder((prev: { id: number; }) => (prev && prev.id === orderId ? { ...prev, ...patch } : prev))
  }, [])

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

  const q = query.trim().toLowerCase()
  const ordersByStatus = useMemo(() => {
    const res: Record<Status, any[]> = { NEW: [], IN_PROGRESS: [], READY: [], CANCELLED: [] }
    for (const o of localOrders ?? []) {
      const idHit = String(o.id).includes(q)
      const emailHit = (o.user?.email || "").toLowerCase().includes(q)
      const nameHit = ((o.user?.firstName || "") + " " + (o.user?.lastName || "")).toLowerCase().includes(q)
      const productsHit = Array.isArray(o.products)
        ? (o.products as any[]).some(p => (p?.name || "").toLowerCase().includes(q))
        : false
      if (!q || idHit || emailHit || nameHit || productsHit) {
        const st: Status = o.status ?? "NEW"
        res[st].push(o)
      }
    }
    return res
  }, [localOrders, q])

  const visibleStatuses = useMemo(() => {
    const all: Status[] = ["NEW", "IN_PROGRESS", "READY", "CANCELLED"]
    const base = isMobile ? MOBILE_FLOW : all
    if (statusFilter === "ALL") return base
    return base.filter(s => s === statusFilter)
  }, [statusFilter, isMobile])

  return (
    <>
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
        {isMobile && (
          <select
            className="rounded-lg border px-3 py-2 text-sm bg-white"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as Status | "ALL"); scrollToStatus(e.target.value as Status) }}
          >
            <option value="ALL">Все</option>
            {MOBILE_FLOW.map(st => (
              <option key={st} value={st}>{STATUSES[st].label}</option>
            ))}
          </select>
        )}
      </div>

      <div
        ref={boardRef}
        className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 w-full max-w-full overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none px-2 box-border min-h-0 overscroll-contain"
        style={{ height: boardHeight ?? undefined, WebkitOverflowScrolling: "touch" }}
      >
        {Object.entries(STATUSES)
          .filter(([status]) => visibleStatuses.includes(status as Status))
          .map(([status, { label, color }]) => {
            const list = ordersByStatus[status as Status] || []
            return (
              <div
                key={status}
                ref={(node) => { colRefs.current[status as Status] = node }}
                className={`snap-start flex-none w-[90vw] md:w-auto ${color} border-2 rounded-2xl shadow-sm p-4 box-border min-h-0 max-w-full overflow-hidden`}
                style={{ height: boardHeight ?? undefined, overscrollBehavior: "contain", touchAction: "pan-y" }}
              >
                <div className="sticky top-0 z-10 -mx-4 px-4 pt-1 pb-3 bg-gradient-to-b from-[inherit] to-[color:transparent]">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-bold text-lg">{label} ({list.length})</h2>
                  </div>
                </div>
                <div
                  className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 scrollbar-hide"
                  style={{ maxHeight: boardHeight ? boardHeight - 56 : undefined, WebkitOverflowScrolling: "touch", overscrollBehavior: "contain" }}
                >
                  {list.map((order) => (
                    <div key={order.id} className="p-4 bg-white rounded-xl shadow border border-gray-100 hover:shadow-md cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold leading-tight truncate">Заказ #{order.id}</p>
                          <p className="text-sm text-gray-600 truncate">{order.user?.firstName} {order.user?.lastName} · {order.user?.email}</p>
                        </div>
                        <StatusBadge status={order.status ?? "NEW"} />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-3">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-lg w-full max-w-lg p-6 relative">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-3 right-3 text-gray-500 hover:text-black" aria-label="Закрыть">
              <IconX className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold mb-1">Заказ #{selectedOrder.id}</h2>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span>{new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}</span>
              <StatusBadge status={selectedOrder.status ?? "NEW"} />
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-gray-500">Клиент</span><span className="font-medium text-right truncate">{selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</span></div>
              <div className="flex items-center justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-right break-all">{selectedOrder.user?.email}</span></div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <select
                className="rounded-lg border px-3 py-2 text-sm bg-white"
                value={selectedOrder.status}
                onChange={async (e) => {
                  const value = e.target.value as Status
                  await patchStatus(selectedOrder.id, value)
                  applyLocalUpdate(selectedOrder.id, { status: value })
                }}
              >
                {(isMobile ? MOBILE_FLOW : (Object.keys(STATUSES) as Status[])).map(st => (
                  <option key={st} value={st}>{STATUSES[st].label}</option>
                ))}
              </select>
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
