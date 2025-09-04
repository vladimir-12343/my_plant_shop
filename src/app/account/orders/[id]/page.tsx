import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // 👈 ждём Promise
  const c = await cookies()
  const email = c.get("userEmail")?.value

  if (!email) redirect("/login")

  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: { user: true },
  })

  if (!order || order.user?.email !== email) {
    redirect("/account")
  }

  const products: Array<{ id: number; name: string; price: number; quantity: number }> =
    (order.products as any) || []

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Заказ #{order.id}</h1>
      <p className="text-gray-600 mb-2">
        Дата: {new Date(order.createdAt).toLocaleString("ru-RU")}
      </p>
      <p className="mb-6">
        Статус:{" "}
        <span
          className={`px-2 py-1 rounded text-sm ${
            order.status === "NEW"
              ? "bg-yellow-100 text-yellow-800"
              : order.status === "IN_PROGRESS"
              ? "bg-blue-100 text-blue-800"
              : order.status === "READY"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {order.status === "NEW" && "Новый"}
          {order.status === "IN_PROGRESS" && "В работе"}
          {order.status === "READY" && "Готов"}
          {order.status === "CANCELLED" && "Отменён"}
        </span>
      </p>

      <h2 className="text-lg font-semibold mb-3">Состав заказа</h2>
      {products.length === 0 ? (
        <p className="text-gray-500">Товары не найдены</p>
      ) : (
        <ul className="space-y-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex justify-between border-b pb-2 text-sm"
            >
              <span>
                {p.name} × {p.quantity}
              </span>
              <span>{((p.price * p.quantity) / 100).toFixed(2)} ₽</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 font-bold">
        Итого: {(order.total / 100).toFixed(2)} ₽
      </div>
    </div>
  )
}
