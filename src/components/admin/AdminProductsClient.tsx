"use client";

import { useMemo, useState, useRef } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
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

// helpers
const isValidSrc = (s?: unknown): s is string => typeof s === "string" && s.trim() !== "";
const sanitizeImages = (arr?: unknown): string[] => (Array.isArray(arr) ? (arr as unknown[]).filter(isValidSrc) : []);
const sanitizeProduct = (p: any) => {
  const images = sanitizeImages(p?.images);
  const coverImage = isValidSrc(p?.coverImage) ? p.coverImage : images[0] ?? null;
  return { ...p, images, coverImage };
};

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AdminProductsClient({ products, categories, lowStockThreshold }: AdminProductsClientProps) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const q = (sp.get("q") || "").trim();
  const categoryFilter = sp.get("category") || "";
  const lowOnly = sp.get("low") === "1";
  const threshold = Number(lowStockThreshold ?? 5);

  const categoriesSafe = useMemo(() => (Array.isArray(categories) ? categories : []), [categories]);
  const productsSafe = useMemo(() => (Array.isArray(products) ? products.map(sanitizeProduct) : []), [products]);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showFormSheet, setShowFormSheet] = useState(false);

  const desktopFormRef = useRef<HTMLDivElement | null>(null);

  const initialForForm: ProductInitial | undefined = useMemo(() => {
    if (!editingProduct) return undefined;
    const images = sanitizeImages(editingProduct.images);
    const base: ProductInitial = {
      id: editingProduct.id,
      name: editingProduct.name,
      description: editingProduct.description ?? "",
      price: editingProduct.price,
      stock: editingProduct.stock ?? 0,
      images,
    };
    return {
      ...base,
      ...(editingProduct.compareAtPrice != null ? { compareAtPrice: editingProduct.compareAtPrice } : {}),
      ...(editingProduct.sku ? { sku: editingProduct.sku } : {}),
      ...(editingProduct.categoryId != null ? { categoryId: editingProduct.categoryId } : {}),
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
    return params.toString() ? `?${params.toString()}` : "";
  }

  const filteredProducts = useMemo(() => {
    if (!productsSafe.length) return [];
    const qLower = q.toLowerCase();
    return productsSafe
      .filter((p) => {
        const okName = (p?.name || "").toLowerCase().includes(qLower);
        const okCat = categoryFilter ? String(p?.categoryId) === String(categoryFilter) : true;
        const okLow = lowOnly ? Number(p?.stock ?? 0) <= threshold : true;
        return okName && okCat && okLow;
      })
      .sort((a, b) => (lowOnly ? (a.stock ?? 0) - (b.stock ?? 0) : 0));
  }, [productsSafe, q, categoryFilter, lowOnly, threshold]);

  return (
    <div className="max-w-screen-2xl mx-auto p-3 sm:p-4">
      {/* Header */}
      <div className="mb-4 lg:mb-6 flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Товары</h1>
        <div className="hidden lg:flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              desktopFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="rounded-xl border px-3 py-2 bg-white hover:bg-gray-50"
          >
            Новый товар
          </button>
          <Link href="/admin/orders" className="rounded-xl px-3 py-2 bg-green-600 text-white hover:bg-green-700 transition">Заказы</Link>
        </div>
      </div>

      {/* Layout */}
      <div className="lg:grid lg:grid-cols-[420px_1fr] lg:gap-6">
        {/* Form desktop */}
        <section ref={desktopFormRef} className="hidden lg:block border rounded-2xl p-4 bg-white shadow-sm sticky top-4 h-fit">
          <h2 className="font-medium mb-3 text-lg">{editingProduct ? "Редактировать товар" : "Создать товар"}</h2>
          <ProductForm
            key={editingProduct ? `edit-${editingProduct.id}` : "new"}
            categories={categoriesSafe.map((c) => ({ id: c.id, name: c.name }))}
            {...(initialForForm ? { initial: initialForForm } : {})}
            onCancel={() => {
              setEditingProduct(null);
              // после закрытия формы на десктопе получим свежие данные
              router.refresh();
            }}
            // Если ProductForm поддерживает onSuccess — обновим список сразу
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            onSuccess={() => {
              router.refresh();
            }}
          />
        </section>

        {/* List + Filters */}
        <section className="border rounded-2xl p-3 sm:p-4 bg-white shadow-sm">
          {/* Desktop toolbar */}
          <div className="hidden lg:block mb-4">
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <form className="flex items-center gap-3" action="" method="get">
                <input
                  type="text"
                  name="q"
                  placeholder="Введите название товара..."
                  defaultValue={q}
                  className="rounded-xl border px-3 py-2 w-64"
                  aria-label="Поиск по названию"
                />
                <select
                  name="category"
                  defaultValue={categoryFilter}
                  className="rounded-xl border px-3 py-2"
                  aria-label="Фильтр по категории"
                >
                  <option value="">Все категории</option>
                  {categoriesSafe.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="inline-flex overflow-hidden rounded-xl border">
                  <Link href={`${pathname}${buildQuery({ low: undefined })}`} className={clsx("px-3 py-2 text-sm", !lowOnly && "bg-gray-900 text-white")}>Все</Link>
                  <Link href={`${pathname}${buildQuery({ low: "1" })}`} className={clsx("px-3 py-2 text-sm", lowOnly && "bg-gray-900 text-white")}>Мало</Link>
                </div>
                <button type="submit" className="rounded-xl border px-4 py-2 bg-[#c7a17a] text-white hover:bg-[#b8926d] transition">Применить</button>
                <Link href={`${pathname}${buildQuery({ q: undefined, category: undefined, low: undefined })}`} className="rounded-xl border px-4 py-2 bg-white hover:bg-gray-50">Сбросить</Link>
              </form>
            </div>
          </div>

          {/* Mobile toolbar */}
          <div className="lg:hidden mb-3 sticky top-2 z-20">
            <div className="rounded-2xl border bg-white/80 backdrop-blur p-2 shadow-sm">
              {/* Строка поиска — на всю ширину */}
              <form action="" method="get" className="mb-2">
                <div className="relative w-full">
                  <input type="text" name="q" placeholder="Поиск товара" defaultValue={q} className="w-full rounded-xl border pl-3 pr-20 py-2 text-sm" />
                  <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-3 py-1.5 text-sm bg-gray-900 text-white">Найти</button>
                </div>
              </form>
              {/* Ряд из двух равных кнопок */}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setShowFilters(true)} className="w-full rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">Фильтры</button>
                <button type="button" onClick={() => setShowActions(true)} className="w-full rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">Действия</button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-3">
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> ≤ 2 шт.</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-orange-400" /> ≤ {threshold} шт.</span>
            <span className="inline-flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> &gt; {threshold} шт.</span>
            <span className="ml-auto text-gray-500">Найдено: {filteredProducts.length}</span>
            <Link href="/admin/orders" className="sm:hidden underline text-gray-700">Заказы</Link>
          </div>

          {/* Products */}
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500">Товары не найдены</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((raw) => {
                const p = sanitizeProduct(raw);
                const stock = Number(p?.stock ?? 0);
                const stockColor = stock <= 2 ? "text-red-600" : stock <= threshold ? "text-orange-600" : "text-emerald-600";
                const stockDot = stock <= 2 ? "bg-red-500" : stock <= threshold ? "bg-orange-400" : "bg-emerald-500";
                return (
                  <li key={p.id} className="group">
                    <ProductCard
                      product={p}
                      mode="admin"
                      onEdit={() => {
                        setEditingProduct(p);
                        setShowFormSheet(true);
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <div className={`text-sm font-medium ${stockColor}`}>Остаток: {stock} шт.</div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${stockDot}`} />
                        {stock <= threshold && (
                          <Link href={`${pathname}${buildQuery({ low: "1" })}`} className="text-xs text-gray-500 hover:text-gray-700 underline">Низкий остаток</Link>
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

      {/* Bottom Sheet — фильтры (mobile) */}
      {showFilters && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" id="filters-sheet">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] rounded-t-2xl bg-white border shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">Фильтры</h3>
              <button onClick={() => setShowFilters(false)} className="rounded-xl border px-2.5 py-1 text-sm hover:bg-gray-50">Закрыть</button>
            </div>
            <form method="get" className="grid gap-3">
              <input type="hidden" name="q" defaultValue={q} />
              <label className="grid gap-1 text-sm">
                <span className="text-gray-700">Категория</span>
                <select name="category" defaultValue={categoryFilter} className="rounded-xl border px-3 py-2 text-sm">
                  <option value="">Все категории</option>
                  {categoriesSafe.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2">
                <span className="text-sm">Мало на складе (≤ {threshold})</span>
                <input type="checkbox" name="low" value="1" defaultChecked={lowOnly} className="h-5 w-5" />
              </label>
              <div className="flex items-center justify-between gap-2 pt-2">
                <Link href={`${pathname}${buildQuery({ q: undefined, category: undefined, low: undefined })}`} className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50" onClick={() => setShowFilters(false)}>Сбросить всё</Link>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowFilters(false)} className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50">Отмена</button>
                  <button type="submit" className="rounded-xl border px-3 py-2 text-sm bg-gray-900 text-white">Применить</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Sheet — действия (mobile) */}
      {showActions && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" id="actions-sheet">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowActions(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[60vh] rounded-t-2xl bg-white border shadow-lg p-4">
            <h3 className="text-base font-semibold mb-2">Действия</h3>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setShowFormSheet(true);
                  setShowActions(false);
                }}
                className="rounded-xl border px-3 py-3 text-sm text-left hover:bg-gray-50"
              >
                Создать товар
              </button>
              <Link href="/admin/orders" className="rounded-xl border px-3 py-3 text-sm hover:bg-gray-50" onClick={() => setShowActions(false)}>Заказы</Link>
            </div>
            <div className="flex justify-end mt-3">
              <button className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50" onClick={() => setShowActions(false)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet — форма */}
      {showFormSheet && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" id="form-sheet">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFormSheet(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl bg-white border shadow-lg p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold">{editingProduct ? "Редактировать товар" : "Создать товар"}</h3>
              <button
                onClick={() => {
                  setShowFormSheet(false);
                  router.refresh();
                }}
                className="rounded-xl border px-2.5 py-1 text-sm hover:bg-gray-50"
              >
                Закрыть
              </button>
            </div>
            <ProductForm
              key={editingProduct ? `m-edit-${editingProduct.id}` : "m-new"}
              categories={categoriesSafe.map((c) => ({ id: c.id, name: c.name }))}
              {...(initialForForm ? { initial: initialForForm } : {})}
              onCancel={() => {
                setShowFormSheet(false);
                // получаем свежий список после выхода из формы на мобиле
                router.refresh();
              }}
              // Если ProductForm умеет звать onSuccess — обновляем сразу
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              onSuccess={() => {
                setShowFormSheet(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}