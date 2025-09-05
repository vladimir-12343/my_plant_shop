"use client";

import { useMemo, useState } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ProductForm, type Initial as ProductInitial } from "@/components/admin/ProductForm";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type AdminProductsClientProps = {
  products?: any[];
  categories?: any[];
  lowOnly?: boolean;
  lowStockThreshold?: number;
};

// --- helpers ---
const isValidSrc = (s?: unknown): s is string =>
  typeof s === "string" && s.trim() !== "";

const sanitizeImages = (arr?: unknown): string[] =>
  Array.isArray(arr) ? (arr as unknown[]).filter(isValidSrc) : [];

const sanitizeProduct = (p: any) => {
  const images = sanitizeImages(p?.images);
  const coverImage = isValidSrc(p?.coverImage) ? p.coverImage : images[0] ?? null;
  return {
    ...p,
    images,
    coverImage, // ← никогда не ""
  };
};

export default function AdminProductsClient({
  products,
  categories,
  lowStockThreshold,
}: AdminProductsClientProps) {
  const sp = useSearchParams();
  const pathname = usePathname();

  const q = (sp.get("q") || "").trim();
  const categoryFilter = sp.get("category") || "";
  const lowOnly = sp.get("low") === "1";
  const threshold = Number(lowStockThreshold ?? 5);

  const categoriesSafe = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories]
  );

  // сразу санитизируем товары (убираем пустые src)
  const productsSafe = useMemo(
    () => (Array.isArray(products) ? products.map(sanitizeProduct) : []),
    [products]
  );

  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  // initial для формы (тоже с очищенными images)
  const initialForForm: ProductInitial | undefined = useMemo(() => {
    if (!editingProduct) return undefined;

    const images = sanitizeImages(editingProduct.images);
    const base: ProductInitial = {
      id: editingProduct.id,
      name: editingProduct.name,
      description: editingProduct.description ?? "",
      price: editingProduct.price,
      stock: editingProduct.stock ?? 0,
      images, // ← только валидные
    };

    return {
      ...base,
      ...(editingProduct.compareAtPrice != null
        ? { compareAtPrice: editingProduct.compareAtPrice }
        : {}),
      ...(editingProduct.sku ? { sku: editingProduct.sku } : {}),
      ...(editingProduct.categoryId != null
        ? { categoryId: editingProduct.categoryId }
        : {}),
      ...(editingProduct.discount != null ? { discount: editingProduct.discount } : {}),
    };
  }, [editingProduct]);

  function buildQuery(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v == null || v === "") params.delete(k);
      else params.set(k, v);
    });
    for (const [k, v] of Array.from(params.entries())) if (!v) params.delete(k);
    const s = params.toString();
    return s ? `?${s}` : "";
  }

  const filteredProducts = useMemo(() => {
    if (!productsSafe.length) return [];
    const qLower = q.toLowerCase();

    return productsSafe
      .filter((p) => {
        const okName = (p?.name || "").toLowerCase().includes(qLower);
        const okCat = categoryFilter
          ? String(p?.categoryId) === String(categoryFilter)
          : true;
        const okLow = lowOnly ? Number(p?.stock ?? 0) <= threshold : true;
        return okName && okCat && okLow;
      })
      .sort((a, b) => {
        if (!lowOnly) return 0;
        return (a.stock ?? 0) - (b.stock ?? 0);
      });
  }, [productsSafe, q, categoryFilter, lowOnly, threshold]);

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Форма */}
      <section className="border rounded-2xl p-4 bg-white shadow-sm">
        <h2 className="font-medium mb-3 text-lg">
          {editingProduct ? "Редактировать товар" : "Создать товар"}
        </h2>
        <ProductForm
          key={editingProduct ? `edit-${editingProduct.id}` : "new"}
          categories={categoriesSafe.map((c) => ({ id: c.id, name: c.name }))}
          {...(initialForForm ? { initial: initialForForm } : {})}
          onCancel={() => setEditingProduct(null)}
        />
      </section>

      {/* Список */}
      <section className="border rounded-2xl p-4 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <form className="flex gap-3 w-full sm:w-auto" action="">
            <input
              type="text"
              name="q"
              placeholder="Введите название товара..."
              defaultValue={q}
              className="rounded-xl border px-3 py-2 w-full sm:w-64"
            />
            <select
              name="category"
              defaultValue={categoryFilter}
              className="rounded-xl border px-3 py-2"
            >
              <option value="">Все категории</option>
              {categoriesSafe.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl border px-4 py-2 bg-[#c7a17a] text-white hover:bg-[#b8926d] transition"
            >
              Применить
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Link
              href={`${pathname}${buildQuery({ low: undefined })}`}
              className={`inline-block rounded-xl px-3 py-2 border text-sm ${
                !lowOnly ? "bg-gray-900 text-white" : "hover:bg-gray-50"
              }`}
            >
              Все товары
            </Link>
            <Link
              href={`${pathname}${buildQuery({ low: "1" })}`}
              className={`inline-block rounded-xl px-3 py-2 border text-sm ${
                lowOnly ? "bg-gray-900 text-white" : "hover:bg-gray-50"
              }`}
            >
              Мало на складе
            </Link>
          </div>

          <Link
            href="/admin/orders"
            className="inline-block rounded-xl px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition"
          >
            Заказы
          </Link>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-600 mb-4">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> ≤ 2 шт.
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-orange-400" /> ≤ {threshold} шт.
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> &gt; {threshold} шт.
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <p className="text-gray-500">Товары не найдены</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((raw) => {
              const p = sanitizeProduct(raw); // ← ещё раз на всякий
              const stock: number = Number(p?.stock ?? 0);
              const stockColor =
                stock <= 2
                  ? "text-red-600"
                  : stock <= threshold
                  ? "text-orange-600"
                  : "text-emerald-600";
              const stockDot =
                stock <= 2
                  ? "bg-red-500"
                  : stock <= threshold
                  ? "bg-orange-400"
                  : "bg-emerald-500";

              return (
                <li key={p.id} className="group">
                  <ProductCard
                    product={p}           // ← с чистыми images/coverImage
                    mode="admin"
                    onEdit={() => setEditingProduct(p)}
                  />
                  <div className="mt-2 flex items-center justify-between">
                    <div className={`text-sm font-medium ${stockColor}`}>
                      Остаток: {stock} шт.
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${stockDot}`} />
                      {stock <= threshold && (
                        <Link
                          href={`${pathname}${buildQuery({ low: "1" })}`}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Низкий остаток
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
