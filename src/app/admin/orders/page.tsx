// src/app/admin/orders/page.tsx
import prisma from "@/lib/prisma";
import AdminOrdersKanban from "@/components/admin/AdminOrdersKanban";
import { Prisma, OrderStatus } from "@prisma/client"; // ✅ так корректнее: импорт и типов, и enum

export const dynamic = "force-dynamic";

type Search = {
  status?: string;
  date?: string;
  q?: string;
  sort?: string;
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<Search>;
}) {
  const sp = (await searchParams) ?? {};

  const status = sp.status || "";
  const date = sp.date || "";
  const q = (sp.q || "").trim().toLowerCase();
  const sort = sp.sort || "date_desc";

  // Фильтр по дате
  let createdAtFilter: Prisma.OrderWhereInput["createdAt"];
  if (date === "today") {
    createdAtFilter = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
  } else if (date === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    createdAtFilter = { gte: d };
  } else if (date === "month") {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    createdAtFilter = { gte: d };
  }

  // Сортировка
  const orderBy: Prisma.OrderOrderByWithRelationInput =
    sort === "date_asc"
      ? { createdAt: "asc" }
      : sort === "total_desc"
      ? { total: "desc" }
      : sort === "total_asc"
      ? { total: "asc" }
      : { createdAt: "desc" };

  // Валидируем статус по enum
  const validStatus = (Object.values(OrderStatus) as string[]).includes(status)
    ? (status as OrderStatus)
    : undefined;

  const orders = await prisma.order.findMany({
    where: {
      ...(validStatus ? { status: validStatus } : {}),
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
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Заказы (Kanban)</h1>
      {/* ... фильтры и канбан ... */}
      <AdminOrdersKanban orders={orders} />
    </div>
  );
}
