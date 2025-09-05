"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Cat = { id: number; name: string };

export type Initial = {
  id: number;
  name: string;
  description?: string;
  price: number;           // в копейках
  compareAtPrice?: number; // в копейках
  stock: number;
  sku?: string;
  categoryId?: number;
  images: string[];
  discount?: number;       // 0..100
};

type FormState = {
  name?: string;
  description?: string;
  price?: string;
  compareAtPrice?: string;
  stock?: number;
  sku?: string;
  categoryId?: number | string; // ⚠️ держим как number | string, без undefined
  newCategory?: string;
  images: string[];
  discount?: number;
  _loadedFromInitial?: boolean;
};

function centsToStr(cents?: number) {
  return cents == null ? "" : (cents / 100).toFixed(2);
}

function normalizeMoneyInput(v: string) {
  return v.replace(/[^\d.,]/g, "").replace(",", ".");
}

function toCents(v?: string) {
  if (!v) return undefined;
  const num = Number.parseFloat(normalizeMoneyInput(v));
  if (Number.isNaN(num)) return undefined;
  return Math.round(num * 100);
}

interface ProductFormProps {
  categories: Cat[];
  initial?: Initial;
  onCancel?: () => void;
}

export function ProductForm({ categories, initial, onCancel }: ProductFormProps) {
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>({ images: [] });

  // Заполнить из initial при редактировании
  useEffect(() => {
    if (initial && !formState._loadedFromInitial) {
      setFormState({
        name: initial.name,
        description: initial.description ?? "",
        price: centsToStr(initial.price),
        compareAtPrice: centsToStr(initial.compareAtPrice),
        stock: initial.stock ?? 0,
        sku: initial.sku ?? "",
        categoryId: initial.categoryId ?? "",   // ✅ НЕ undefined, а ""
        images: initial.images || [],
        discount: initial.discount ?? 0,
        _loadedFromInitial: true,
      });
    }
  }, [initial, formState._loadedFromInitial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === "price") {
      const normalized = normalizeMoneyInput(value);
      setFormState((prev) => {
        const next: FormState = { ...prev, price: normalized };
        const newPrice = Number.parseFloat(normalized || "0");
        const oldStr = prev.compareAtPrice ? normalizeMoneyInput(prev.compareAtPrice) : "";
        const oldNum = oldStr ? Number.parseFloat(oldStr) : NaN;
        if (!Number.isNaN(oldNum) && oldNum <= (Number.isNaN(newPrice) ? 0 : newPrice)) {
          next.compareAtPrice = "";
        }
        return next;
      });
      return;
    }

    if (name === "compareAtPrice") {
      value = normalizeMoneyInput(value);
      setFormState((prev) => ({ ...prev, compareAtPrice: value }));
      return;
    }

    if (name === "stock" || name === "discount") {
      setFormState((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
      return;
    }

    if (name === "categoryId") {
      setFormState((prev) => ({
        ...prev,
        categoryId: value === "" ? "" : Number(value), // ✅ пустое значение — "", не undefined
      }));
      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceBlur = (field: "price" | "compareAtPrice") => {
    setFormState((prev) => {
      const raw = prev[field];
      if (!raw) return prev;
      const num = Number.parseFloat(normalizeMoneyInput(raw));
      if (Number.isNaN(num)) return { ...prev, [field]: "" };
      return { ...prev, [field]: num.toFixed(2) };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Ошибка загрузки изображения");
      const data: { urls: string[] } = await res.json();

      setFormState((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...data.urls],
      }));
    } catch {
      setErr("Не удалось загрузить изображение");
    }
  };

  const handleRemoveImage = (url: string) => {
    setFormState((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img !== url),
    }));
  };

  const resetForm = () => {
    setFormState({ images: [] });
    setErr(null);
    setOk(null);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setErr(null);
    setOk(null);

    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const name = String(fd.get("name") || "").trim();
    if (!name) {
      setErr("Название обязательно для заполнения");
      return;
    }

    const priceCents = toCents(String(fd.get("price") || ""));
    if (!priceCents || priceCents <= 0) {
      setErr("Цена должна быть больше 0");
      return;
    }

    const compareAtCents = toCents(String(fd.get("compareAtPrice") || ""));
    if (compareAtCents != null && compareAtCents <= priceCents) {
      // авто-очистка — просто не отправим поле compareAtPrice
    }

    const stock = Number(fd.get("stock") || 0);
    const sku = String(fd.get("sku") || "").trim() || undefined;

    // value из select'а может быть "" → пусть станет NaN, мы это обработаем
    const rawCat = String(fd.get("categoryId") ?? "");
    let categoryId = rawCat === "" ? NaN : Number(rawCat);

    const newCategory = String(fd.get("newCategory") || "").trim();
    const description = String(fd.get("description") || "");

    if (!formState.images || formState.images.length === 0) {
      setErr("Нужно загрузить хотя бы одно изображение");
      return;
    }

    const discountRaw = String(fd.get("discount") || "").trim();
    const discount = discountRaw ? Number(discountRaw) : 0;
    if (discount < 0 || discount > 100) {
      setErr("Скидка должна быть от 0 до 100%");
      return;
    }

    start(async () => {
      try {
        if ((Number.isNaN(categoryId) || !categoryId) && newCategory) {
          const catRes = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newCategory }),
          });
          if (!catRes.ok) throw new Error("Не удалось создать категорию");
          const created: { id: number } = await catRes.json();
          categoryId = created.id;
        }

        const body = {
          name,
          price: priceCents,
          compareAtPrice:
            compareAtCents != null && compareAtCents > priceCents
              ? compareAtCents
              : undefined,
          stock,
          sku,
          categoryId: Number.isNaN(categoryId) ? undefined : categoryId,
          description,
          images: formState.images,
          discount,
          coverImage: formState.images[0] || null,
        };

        const url = initial
          ? `/api/admin/products/${initial.id}`
          : "/api/admin/products";
        const method = initial ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `Ошибка ${res.status}`);
        }

        setOk("Сохранено ✅");
        resetForm();
        if (initial) {
          onCancel?.();
        } else {
          (e.currentTarget as HTMLFormElement | null)?.reset();
        }

        router.refresh();
      } catch (error: unknown) {
        setOk(null);
        setErr(error instanceof Error ? error.message : "Неизвестная ошибка");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        name="name"
        value={formState.name || ""}
        onChange={handleChange}
        placeholder="Название товара"
        className="w-full rounded-xl border px-3 py-2"
      />

      <textarea
        name="description"
        value={formState.description || ""}
        onChange={handleChange}
        placeholder="Описание товара"
        className="w-full rounded-xl border px-3 py-2"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          name="price"
          inputMode="decimal"
          value={formState.price || ""}
          onChange={handleChange}
          onBlur={() => handlePriceBlur("price")}
          placeholder="Цена, напр. 1999.00"
          className="rounded-xl border px-3 py-2"
        />
        <input
          name="compareAtPrice"
          inputMode="decimal"
          value={formState.compareAtPrice || ""}
          onChange={handleChange}
          onBlur={() => handlePriceBlur("compareAtPrice")}
          placeholder="Старая цена"
          className="rounded-xl border px-3 py-2"
        />
        <input
          name="stock"
          type="number"
          min={0}
          value={formState.stock ?? 0}
          onChange={handleChange}
          placeholder="Количество"
          className="rounded-xl border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="number"
          name="discount"
          min={0}
          max={100}
          value={formState.discount ?? ""}
          onChange={handleChange}
          placeholder="Скидка (%)"
          className="rounded-xl border px-3 py-2"
        />

        <select
          name="categoryId"
          value={formState.categoryId || ""}  // "" когда пусто
          onChange={handleChange}
          className="rounded-xl border px-3 py-2"
        >
          <option value="">-- выбрать категорию --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <input
        name="newCategory"
        value={formState.newCategory || ""}
        onChange={handleChange}
        placeholder="Новая категория"
        className="w-full rounded-xl border px-3 py-2"
      />

      <input
        name="sku"
        value={formState.sku || ""}
        onChange={handleChange}
        placeholder="Артикул (SKU)"
        className="w-full rounded-xl border px-3 py-2"
      />

      {/* Загрузка файлов */}
      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full rounded-xl border px-3 py-2"
        />

        {formState.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formState.images.map((url, i) => (
              <div key={url + i} className="relative">
                <Image
                  src={url}
                  alt={`image-${i}`}
                  width={80}
                  height={80}
                  className="object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  aria-label="Удалить изображение"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-xl border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
        >
          {pending ? "Сохранение..." : initial ? "Обновить товар" : "Создать товар"}
        </button>

        {initial && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border px-3 py-2 bg-gray-100 hover:bg-gray-200"
          >
            Отмена
          </button>
        )}
      </div>

      {err && <pre className="text-sm text-red-600 whitespace-pre-wrap">{err}</pre>}
      {ok && <p className="text-sm text-emerald-600">{ok}</p>}
    </form>
  );
}
