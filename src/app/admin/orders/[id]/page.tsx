import prisma from "@/lib/prisma";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: Number(params.id) },
    include: { user: true },
  });

  if (!order) {
    return <div className="p-6">Заказ не найден</div>;
  }

  const products: Array<{ id: number; name: string; price: number; quantity: number }> =
    (order.products as any) || [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Заказ #{order.id}</h1>
      <p className="mb-2">
        Клиент: {order.user?.firstName} {order.user?.lastName}
      </p>
      <p className="mb-2">Email: {order.user?.email}</p>

      <h2 className="text-lg font-semibold mb-3 mt-6">Состав заказа</h2>
      {products.length === 0 ? (
        <p className="text-gray-500">Товары не найдены</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {products.map((p) => (
            <li key={p.id} className="flex justify-between border-b pb-2 text-sm">
              <span>
                {p.name} × {p.quantity}
              </span>
              <span>{((p.price * p.quantity) / 100).toFixed(2)} ₽</span>
            </li>
          ))}
        </ul>
      )}

      {/* ✅ Общая сумма */}
      <div className="text-right font-bold text-lg">
        Итого: {(order.total / 100).toFixed(2)} ₽
      </div>
    </div>
  );
}
