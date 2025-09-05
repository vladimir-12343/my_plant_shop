"use client"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useEffect, useRef, useState, useLayoutEffect, useMemo } from "react"

const STATUSES: Record<string, { label: string; color: string }> = {
  NEW: { label: "Новые", color: "bg-yellow-50 border-yellow-200" },
  IN_PROGRESS: { label: "В работе", color: "bg-blue-50 border-blue-200" },
  READY: { label: "Готовые", color: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Отменённые", color: "bg-red-50 border-red-200" },
}

// найти вертикально-скроллируемого родителя (для автоскролла при drag)
function getScrollParent(el: Element | null): HTMLElement | null {
  let node: Element | null = el
  while (node && node !== document.body) {
    const s = getComputedStyle(node as HTMLElement)
    const oy = s.overflowY
    if ((oy === "auto" || oy === "scroll") && (node as HTMLElement).scrollHeight > (node as HTMLElement).clientHeight) {
      return node as HTMLElement
    }
    node = node.parentElement
  }
  return null
}

export default function AdminOrdersKanban({ orders }: { orders: any[] | undefined }) {
  const [localOrders, setLocalOrders] = useState<any[]>(() => orders ?? [])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [query, setQuery] = useState("")

  // при обновлении пропсов подтягиваем список
  useEffect(() => setLocalOrders(orders ?? []), [orders])

  // drag-режим для мобилок (по умолчанию выкл), на десктопе всегда вкл
  const [dragMode, setDragMode] = useState(true)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isCoarse = window.matchMedia?.("(pointer: coarse)")?.matches
      if (isCoarse) setDragMode(false)
    }
  }, [])
  const [isDragging, setIsDragging] = useState(false)
  const draggingRef = useRef(false)

  // вычисляем доступную высоту, чтобы внутри колонок точно был скролл «до низа»
  const boardRef = useRef<HTMLDivElement>(null)
  const [boardHeight, setBoardHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    const compute = () => {
      const el = boardRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const bottomGap = 12 // небольшой отступ снизу
      const h = Math.max(320, Math.floor(vh - rect.top - bottomGap))
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

  // refs колонок + табы прокрутки
  const colRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const scrollToStatus = (status: string) => {
    const el = colRefs.current[status]
    if (el) el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" })
  }

  // Эдж-скролл
  const EDGE = 56
  const STEP = 22
  const handlePointerMove = (e: PointerEvent) => {
    if (!draggingRef.current) return

    const board = boardRef.current
    if (board) {
      const rect = board.getBoundingClientRect()
      if (e.clientX > rect.right - EDGE) board.scrollLeft += STEP
      else if (e.clientX < rect.left + EDGE) board.scrollLeft -= STEP
    }
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const sp = getScrollParent(el)
    if (sp) {
      const r = sp.getBoundingClientRect()
      if (e.clientY > r.bottom - EDGE) sp.scrollTop += STEP
      else if (e.clientY < r.top + EDGE) sp.scrollTop -= STEP
    }
  }
  useEffect(() => () => window.removeEventListener("pointermove", handlePointerMove), [])

  const onDragStart = () => {
    draggingRef.current = true
    setIsDragging(true)
    window.addEventListener("pointermove", handlePointerMove, { passive: true })
  }
  const onDragEnd = async (result: any) => {
    draggingRef.current = false
    setIsDragging(false)
    window.removeEventListener("pointermove", handlePointerMove)

    const { destination, draggableId } = result
    if (!destination) return
    const orderId = Number(draggableId)
    const newStatus = destination.droppableId

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) return console.error("Ошибка при обновлении заказа:", await res.text())
      const updatedOrder = await res.json()
      setLocalOrders(prev => (prev ?? []).map(o => (o.id === orderId ? updatedOrder : o)))
    } catch (e) {
      console.error("Ошибка сети:", e)
    }
  }

  // ===== Поиск =====
  const q = query.trim().toLowerCase()
  const ordersByStatus = useMemo(() => {
    const res: Record<string, any[]> = { NEW: [], IN_PROGRESS: [], READY: [], CANCELLED: [] }
    for (const o of localOrders ?? []) {
      const idHit = String(o.id).includes(q)
      const emailHit = (o.user?.email || "").toLowerCase().includes(q)
      const nameHit =
        ((o.user?.firstName || "") + " " + (o.user?.lastName || "")).toLowerCase().includes(q)
      const productsHit = Array.isArray(o.products)
        ? (o.products as any[]).some(p => (p?.name || "").toLowerCase().includes(q))
        : false

      if (!q || idHit || emailHit || nameHit || productsHit) {
        const st = o.status ?? "NEW"
        if (!res[st]) res[st] = []
        res[st].push(o)
      }
    }
    return res
  }, [localOrders, q])

  return (
    <>
      {/* Верхняя панель: поиск + (моб) режим перетаскивания + табы статусов */}
      <div className="px-2 mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 w-full md:max-w-md">
          <div className="relative w-full">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск: #id, e-mail, имя или товар…"
              className="w-full rounded-lg border px-3 py-2 pr-9 bg-white"
              inputMode="search"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                aria-label="Очистить"
              >
                ✕
              </button>
            )}
          </div>
          {/* тумблер для мобилки */}
          <button
            onClick={() => setDragMode(v => !v)}
            className={`md:hidden shrink-0 rounded-full border px-3 py-2 text-sm ${dragMode ? "bg-black text-white" : "bg-white"}`}
          >
            {dragMode ? "Готово" : "Перемещать"}
          </button>
        </div>

        {/* Табы статусов (скрыты на десктопе, где видны все колонки) */}
        <div className="md:hidden -mx-1 px-1">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {Object.entries(STATUSES).map(([status, { label }]) => (
              <button
                key={status}
                onClick={() => scrollToStatus(status)}
                className="whitespace-nowrap rounded-full border px-3 py-1.5 text-sm bg-white active:scale-[0.98]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* Доска (высота вычисляется динамически, чтобы внутри всегда был скролл) */}
        <div
          ref={boardRef}
          className="
            flex md:grid md:grid-cols-4
            gap-4 md:gap-6
            w-full max-w-full
            overflow-x-auto md:overflow-visible
            snap-x snap-mandatory md:snap-none
            px-2 box-border
            min-h-0
          "
          style={{
            height: boardHeight ?? undefined,
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
            touchAction: (dragMode || isDragging) ? "none" : "pan-x",
          }}
        >
          {Object.entries(STATUSES).map(([status, { label, color }]) => {
            const list = ordersByStatus[status] || []
            return (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div
                    ref={(node) => {
                      provided.innerRef(node)
                      colRefs.current[status] = node
                    }}
                    {...provided.droppableProps}
                    className={`
                      snap-start
                      flex-none w-[90vw] md:w-auto
                      ${color}
                      border-2 rounded-lg shadow-sm
                      p-4
                      box-border
                      min-h-0 max-w-full overflow-hidden
                    `}
                    style={{
                      height: boardHeight ?? undefined,
                      touchAction: dragMode ? "none" : "pan-y",
                      overscrollBehaviorY: "contain",
                    }}
                  >
                    <h2 className="font-bold mb-4 text-lg sticky top-0 bg-inherit/90 backdrop-blur z-10">
                      {label} ({list.length})
                    </h2>

                    {/* ВНУТРЕННИЙ СКРОЛЛ СПИСКА — докручивается до самого низа */}
                    <div
                      className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 scrollbar-hide"
                      style={{ WebkitOverflowScrolling: "touch", maxHeight: boardHeight ? boardHeight - 56 : undefined }}
                    >
                      {list.map((order, index) => (
                        <Draggable key={order.id} draggableId={String(order.id)} index={index}>
                          {(provided, snapshot) => {
                            const handleProps = dragMode ? provided.dragHandleProps : {}
                            return (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...handleProps}
                                onClick={() => {
                                  if (draggingRef.current) return
                                  setSelectedOrder(order)
                                }}
                                className={`
                                  p-4 w-full max-w-full box-border
                                  bg-white rounded-xl shadow
                                  transition select-none
                                  ${dragMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
                                  overflow-hidden
                                  ${snapshot.isDragging ? "rotate-2 scale-[1.02] shadow-lg" : "hover:shadow-md"}
                                `}
                                style={{
                                  ...provided.draggableProps.style,
                                  touchAction: dragMode ? (snapshot.isDragging ? "none" : "none") : "auto",
                                }}
                              >
                                <p className="font-medium min-w-0 break-words break-all">
                                  Заказ #{order.id} — {(order.total / 100).toFixed(2)} ₽
                                </p>
                                <p className="text-sm text-gray-600 break-words break-all">
                                  {order.user?.firstName} {order.user?.lastName} ({order.user?.email})
                                </p>
                                <p className="text-xs text-gray-400">
                                  {new Date(order.createdAt).toLocaleString("ru-RU")}
                                </p>
                                {!dragMode && (
                                  <div className="mt-2 text-[11px] text-gray-400 md:hidden">
                                    Нужно перетащить? Включите «Перемещать» сверху
                                  </div>
                                )}
                              </div>
                            )
                          }}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            )
          })}
        </div>
      </DragDropContext>

      {/* Модалка с деталями */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">Заказ #{selectedOrder.id}</h2>
            <p className="mb-2">Клиент: {selectedOrder.user?.firstName} {selectedOrder.user?.lastName}</p>
            <p className="mb-2 break-words break-all">Email: {selectedOrder.user?.email}</p>
            <p className="mb-4 font-medium">Сумма: {(selectedOrder.total / 100).toFixed(2)} ₽</p>

            <h3 className="font-semibold mb-2">Состав заказа:</h3>
            <ul className="space-y-2 text-sm max-h-[45vh] overflow-y-auto pr-1">
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
