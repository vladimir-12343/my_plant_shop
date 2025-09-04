// src/app/admin/orders/page.tsx
import prisma from "@/lib/prisma"
import AdminOrdersKanban from "@/components/admin/AdminOrdersKanban"
import type { Prisma } from "@prisma/client"
import { OrderStatus } from "@prisma/client" // ← импорт как значения!

export const dynamic = "force-dynamic"

type Search = {
  status?: string
  date?: string
  q?: string
  sort?: string
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Search>
}) {
  const sp = (await searchParams) ?? {}

  const status = sp.status || ""
  const date = sp.date || ""
  const q = (sp.q || "").trim().toLowerCase()
  const sort = sp.sort || "date_desc"

  // Фильтр по дате
  let createdAtFilter: Prisma.DateTimeFilter | undefined
  if (date === "today") {
    createdAtFilter = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  } else if (date === "week") {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    createdAtFilter = { gte: d }
  } else if (date === "month") {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    createdAtFilter = { gte: d }
  }

  // Сортировка
  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sort === "date_asc"
      ? { createdAt: "asc" }
      : sort === "total_desc"
      ? { total: "desc" }
      : sort === "total_asc"
      ? { total: "asc" }
      : { createdAt: "desc" }

  // Валидируем статус по enum (нужен runtime-объект OrderStatus)
  const validStatus = (Object.values(OrderStatus) as string[]).includes(status)
    ? (status as keyof typeof OrderStatus)
    : undefined

  // Запрос заказов
  const orders =
    (await prisma.order.findMany({
      where: {
        ...(validStatus ? { status: validStatus as any } : {}), // Prisma примет enum
        ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        ...(q
          ? {
              OR: [
                { user: { email: { contains: q, mode: "insensitive" } } },
                { user: { firstName: { contains: q, mode: "insensitive" } } },
                { user: { lastName: { contains: q, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      orderBy,
      include: { user: true },
    })) || []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Заказы (Kanban)</h1>

      {/* Форма фильтров */}
      <form className="flex flex-wrap gap-3 items-center border-b pb-4 mb-6">
        <select name="status" defaultValue={status} className="border rounded px-3 py-2">
          <option value="">Все статусы</option>
          <option value="NEW">Новые</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="READY">Готовые</option>
          <option value="CANCELLED">Отменённые</option>
        </select>

        <select name="date" defaultValue={date} className="border rounded px-3 py-2">
          <option value="">За всё время</option>
          <option value="today">Сегодня</option>
          <option value="week">За неделю</option>
          <option value="month">За месяц</option>
        </select>

        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Поиск по email или имени"
          className="border rounded px-3 py-2 flex-1"
        />

        <select name="sort" defaultValue={sort} className="border rounded px-3 py-2">
          <option value="date_desc">Дата: новые сверху</option>
          <option value="date_asc">Дата: старые сверху</option>
          <option value="total_desc">Сумма: дороже → дешевле</option>
          <option value="total_asc">Сумма: дешевле → дороже</option>
        </select>

        <button
          type="submit"
          className="bg-[#c7a17a] text-white px-4 py-2 rounded hover:bg-[#b8926d]"
        >
          Применить
        </button>
      </form>

      <AdminOrdersKanban orders={orders} />
    </div>
  )
}
