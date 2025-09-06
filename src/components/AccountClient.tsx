"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import AddressForm from "@/components/AddressForm"

export default function AccountClient({
  user,
  fullName,
}: {
  user: any
  fullName: string
}) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

  return (
    <div className="min-h-screen bg-white px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Левая часть */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold tracking-wide">Мой аккаунт</h1>
            <button
              onClick={() => signOut()}
              className="text-red-600 hover:underline text-sm"
            >
              Выйти
            </button>
          </div>

          <p className="mb-10 text-lg">
            Добро пожаловать,{" "}
            <span className="font-medium">{fullName}</span>!
          </p>

          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">
              Мои заказы
            </h2>

            {user.orders.length === 0 ? (
              <p className="text-gray-600">У вас пока нет заказов.</p>
            ) : (
              <ul className="space-y-4">
                {user.orders.map((order: any) => (
                  <li key={order.id}>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-left border rounded-lg p-4 shadow-sm bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            Заказ #{order.id} —{" "}
                            {(order.total / 100).toFixed(2)} ₽
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleString("ru-RU")}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium
                            ${
                              order.status === "NEW"
                                ? "bg-yellow-100 text-yellow-800"
                                : order.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                        >
                          {order.status === "NEW" && "Новый"}
                          {order.status === "IN_PROGRESS" && "В работе"}
                          {order.status === "READY" && "Готов"}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Правая часть */}
        <div>
          <h2 className="text-lg font-semibold border-b pb-2 mb-4">
            Основной адрес
          </h2>
          <p className="text-gray-800 mb-1">{fullName}</p>
          <p className="text-gray-600">
            {user.country || "Страна не указана"}
          </p>
          <p className="text-gray-600">
            {user.address || "Адрес не указан"}
          </p>

          <AddressForm user={user} />
        </div>
      </div>

      {/* ✅ Модалка заказа */}
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
              Дата:{" "}
              {new Date(selectedOrder.createdAt).toLocaleString("ru-RU")}
            </p>
            <p className="mb-2">
              Сумма: {(selectedOrder.total / 100).toFixed(2)} ₽
            </p>
            <p className="mb-4">
              Статус:{" "}
              <span
                className={`px-2 py-1 rounded text-sm font-medium
                  ${
                    selectedOrder.status === "NEW"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedOrder.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
              >
                {selectedOrder.status === "NEW" && "Новый"}
                {selectedOrder.status === "IN_PROGRESS" && "В работе"}
                {selectedOrder.status === "READY" && "Готов"}
              </span>
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
    </div>
  )
}
