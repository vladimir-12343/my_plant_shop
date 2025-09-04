"use client"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { useState } from "react"

const STATUSES: Record<string, { label: string; color: string }> = {
  NEW: { label: "Новые", color: "bg-yellow-50 border-yellow-200" },
  IN_PROGRESS: { label: "В работе", color: "bg-blue-50 border-blue-200" },
  READY: { label: "Готовые", color: "bg-green-50 border-green-200" },
  CANCELLED: { label: "Отменённые", color: "bg-red-50 border-red-200" }, // 👈 новая колонка
}

export default function AdminOrdersKanban({
  orders,
}: {
  orders: any[] | undefined
}) {
  const [localOrders, setLocalOrders] = useState<any[]>(() => orders ?? [])
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  const onDragEnd = async (result: any) => {
    const { destination, draggableId } = result
    if (!destination) return

    const orderId = Number(draggableId)
    const newStatus = destination.droppableId

    try {
      // 1️⃣ отправляем PATCH на сервер
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        console.error("Ошибка при обновлении заказа:", await res.json())
        return
      }

      const updatedOrder = await res.json()

      // 2️⃣ обновляем локальный state
      setLocalOrders((prev) =>
        (prev ?? []).map((o) => (o.id === orderId ? updatedOrder : o))
      )
    } catch (err) {
      console.error("Ошибка сети:", err)
    }
  }

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[80vh]">
          {Object.entries(STATUSES).map(([status, { label, color }]) => {
            const filtered = (localOrders ?? []).filter(
              (o) => o.status === status
            )

            return (
              <Droppable droppableId={status} key={status}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col h-[80vh] p-4 border-2 rounded-lg shadow-sm transition ${color}`}
                  >
                    <h2 className="font-bold mb-4 text-lg sticky top-0 bg-inherit z-10">
                      {label} ({filtered.length})
                    </h2>

                    <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 pr-1">
                      {filtered.map((order, index) => (
                        <Draggable
                          key={order.id}
                          draggableId={String(order.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedOrder(order)}
                              className={`p-4 bg-white rounded-xl shadow transition transform cursor-pointer ${
                                snapshot.isDragging
                                  ? "rotate-2 scale-105 shadow-lg"
                                  : "hover:shadow-md"
                              }`}
                            >
                              <p className="font-medium">
                                Заказ #{order.id} —{" "}
                                {(order.total / 100).toFixed(2)} ₽
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.user?.firstName} {order.user?.lastName} (
                                {order.user?.email})
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(
                                  order.createdAt
                                ).toLocaleString("ru-RU")}
                              </p>
                            </div>
                          )}
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

      {/* ✅ Модалка с деталями заказа */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">
              Заказ #{selectedOrder.id}
            </h2>
            <p className="mb-2">
              Клиент: {selectedOrder.user?.firstName}{" "}
              {selectedOrder.user?.lastName}
            </p>
            <p className="mb-2">Email: {selectedOrder.user?.email}</p>
            <p className="mb-4 font-medium">
              Сумма: {(selectedOrder.total / 100).toFixed(2)} ₽
            </p>

            <h3 className="font-semibold mb-2">Состав заказа:</h3>
            <ul className="space-y-2 text-sm">
              {(selectedOrder.products as any[])?.map((p, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b pb-1 text-gray-700"
                >
                  <span>
                    {p.name} × {p.quantity}
                  </span>
                  <span>
                    {((p.price * p.quantity) / 100).toFixed(2)} ₽
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
