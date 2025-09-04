import prisma from "@/lib/prisma"
import AdminOrdersKanban from "@/components/admin/AdminOrdersKanban"

export const dynamic = "force-dynamic"

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: {
    status?: string
    date?: string
    q?: string
    sort?: string
  }
}) {
  const status = searchParams?.status || ""
  const date = searchParams?.date || ""
  const q = (searchParams?.q || "").trim().toLowerCase()
  const sort = searchParams?.sort || "date_desc"

  // фильтр по дате
  let dateFilter: any = {}
  if (date === "today") {
    dateFilter = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
  } else if (date === "week") {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    dateFilter = { gte: d }
  } else if (date === "month") {
    const d = new Date()
    d.setMonth(d.getMonth() - 1)
    dateFilter = { gte: d }
  }

  // сортировка
  let orderBy: any = { createdAt: "desc" }
  if (sort === "date_asc") orderBy = { createdAt: "asc" }
  if (sort === "total_desc") orderBy = { total: "desc" }
  if (sort === "total_asc") orderBy = { total: "asc" }

  // запрос заказов (всегда массив!)
  const orders =
    (await prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
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
        {/* фильтр по статусу */}
        <select
          name="status"
          defaultValue={status}
          className="border rounded px-3 py-2"
        >
          <option value="">Все статусы</option>
          <option value="NEW">Новые</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="READY">Готовые</option>
        </select>

        {/* фильтр по дате */}
        <select
          name="date"
          defaultValue={date}
          className="border rounded px-3 py-2"
        >
          <option value="">За всё время</option>
          <option value="today">Сегодня</option>
          <option value="week">За неделю</option>
          <option value="month">За месяц</option>
        </select>

        {/* поиск по клиенту */}
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Поиск по email или имени"
          className="border rounded px-3 py-2 flex-1"
        />

        {/* сортировка */}
        <select
          name="sort"
          defaultValue={sort}
          className="border rounded px-3 py-2"
        >
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

      {/* Kanban-доска */}
      <AdminOrdersKanban orders={orders} />
    </div>
  )
}
