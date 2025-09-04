"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function LowStockPanel() {
  const { data, isLoading, error } = useSWR("/api/admin/low-stock", fetcher, {
    refreshInterval: 30000, // автообновление каждые 30с
  });

  if (isLoading) return <div>Загрузка…</div>;
  if (error) return <div className="text-red-600">Ошибка загрузки</div>;

  const { threshold, items } = data as {
    threshold: number;
    items: Array<{
      id: number; name: string; stock: number; price: number;
      discount?: number | null; coverImage?: string | null;
      category?: { id: number; name: string } | null;
    }>;
  };

  if (!items.length) {
    return <div className="text-sm text-gray-500">Все в порядке. Ни один товар не ниже порога ({threshold}).</div>;
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600">
        Порог: {threshold}. Всего позиций: {items.length}.
      </div>
      <ul className="divide-y">
        {items.map(p => (
          <li key={p.id} className="py-3 flex items-center gap-3">
            {/* картинка */}
            <div className="w-14 h-14 bg-gray-50 border rounded overflow-hidden flex-shrink-0">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt={p.name} className="w-full h-full object-cover" />
              ) : null}
            </div>

            {/* инфо */}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-gray-500">
                {p.category?.name ?? "Без категории"} · Остаток:{" "}
                <span className={p.stock <= 2 ? "text-red-600" : "text-orange-600"}>
                  {p.stock} шт.
                </span>
              </div>
            </div>

            {/* действия */}
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/products?edit=${p.id}`}
                className="text-xs px-2 py-1 rounded bg-gray-900 text-white hover:bg-black"
              >
                Редактировать
              </Link>
              <Link
                href={`/admin/products?low=1`}
                className="text-xs px-2 py-1 rounded border hover:bg-gray-50"
              >
                Все низкие
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
