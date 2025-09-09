"use client";

import { useState, useTransition, useEffect, useMemo, useRef } from "react";
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
  categoryId?: number | string;
  newCategory?: string;
  images: string[];
  discount?: number;
  _loadedFromInitial?: boolean;
};

// ---------- helpers ----------
const isValidSrc = (s?: unknown): s is string =>
  typeof s === "string" && s.trim() !== "";

const sanitizeImages = (arr?: unknown): string[] =>
  Array.isArray(arr) ? (arr as unknown[]).filter(isValidSrc) : [];

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
  const [nameError, setNameError] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const [formState, setFormState] = useState<FormState>({ images: [] });

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // автофокус при ошибке duplicate_name
  useEffect(() => {
    if (nameError && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [nameError]);

  // Заполнить из initial при редактировании
  useEffect(() => {
    if (initial && !formState._loadedFromInitial) {
      setFormState({
        name: initial.name,
        description: initial.description ?? "",
        price: centsToStr(initial.price),
        compareAtPrice: centsToStr(initial.compareAtPrice),
        stock: initial.stock ?? undefined,
        categoryId: initial.categoryId ?? "",
        images: sanitizeImages(initial.images),
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

    if (name === "name" && nameError) setNameError(false);

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
        categoryId: value === "" ? "" : Number(value),
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
        images: [...(prev.images || []), ...sanitizeImages(data.urls)],
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
    setNameError(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    setErr(null);
    setOk(null);
    setNameError(false);

    const fd = new FormData(e.currentTarget as HTMLFormElement);

    const name = String(fd.get("name") || "").trim();
    if (!name) {
      setErr("Название обязательно для заполнения");
      setNameError(true);
      return;
    }

    const priceCents = toCents(String(fd.get("price") || ""));
    if (!priceCents || priceCents <= 0) {
      setErr("Цена должна быть больше 0");
      return;
    }

    const compareAtCents = toCents(String(fd.get("compareAtPrice") || ""));
    const stock = Number(fd.get("stock") || 0);

    const rawCat = String(fd.get("categoryId") ?? "");
    const categoryId: number | undefined = rawCat === "" ? undefined : Number(rawCat);

    const description = String(fd.get("description") || "");

    const safeImages = sanitizeImages(formState.images);
    if (safeImages.length === 0) {
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
        const url = initial
          ? `/api/admin/products/${initial.id}`
          : "/api/admin/products";
        const method = initial ? "PATCH" : "POST";

        const body = {
          name,
          price: priceCents,
          compareAtPrice:
            compareAtCents != null && compareAtCents > priceCents
              ? compareAtCents
              : undefined,
          stock,
          categoryId,
          description,
          images: safeImages,
          discount,
          coverImage: safeImages[0] || null,
        };

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));

          // ✅ ловим дубликат имени
          if (data?.error === "duplicate_name") {
            setNameError(true);
            throw new Error("Товар с таким названием уже существует");
          }

          throw new Error(data?.error || `Ошибка ${res.status}`);
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

  const previewImages = useMemo(
    () => sanitizeImages(formState.images),
    [formState.images]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Название товара */}
      <div>
        <input
          ref={nameInputRef}
          name="name"
          value={formState.name || ""}
          onChange={handleChange}
          placeholder="Название товара"
          className={`w-full rounded-xl border px-4 py-3 text-base transition-colors
            ${nameError ? "border-red-600 bg-red-100 focus:ring-red-600" : ""}`}
        />
        {nameError && (
          <p className="mt-2 text-sm text-red-700 font-medium">
            ⚠️ Название товара должно быть уникальным. Измените название.
          </p>
        )}
      </div>

      {/* Описание */}
      <textarea
        name="description"
        value={formState.description || ""}
        onChange={handleChange}
        placeholder="Описание товара"
        className="w-full rounded-xl border px-4 py-3 text-base min-h-[100px]"
      />

      {/* Цена */}
      <input
        name="price"
        inputMode="decimal"
        value={formState.price || ""}
        onChange={handleChange}
        onBlur={() => handlePriceBlur("price")}
        placeholder="Цена, напр. 1999.00"
        className="w-full rounded-xl border px-4 py-3 text-base"
      />
      
      {/* Количество */}
      <input
        name="stock"
        type="number"
        min={0}
        value={formState.stock == null ? "" : String(formState.stock)}
        onChange={(e) => {
          const val = Number(e.target.value);
          if (val < 0) return;
          handleChange(e);
        }}
        placeholder="Введите количество растений"
        className="w-full rounded-xl border px-4 py-3 text-base"
      />

      {/* Скидка */}
      <input
        type="number"
        name="discount"
        min={0}
        max={100}
        value={formState.discount == null ? "" : String(formState.discount)}
        onChange={handleChange}
        placeholder="Скидка (%)"
        className="w-full rounded-xl border px-4 py-3 text-base"
      />

      {/* Категория */}
      <select
        name="categoryId"
        value={
          formState.categoryId === "" || formState.categoryId == null
            ? ""
            : String(formState.categoryId)
        }
        onChange={handleChange}
        className="w-full rounded-xl border px-4 py-3 text-base bg-white"
      >
        <option value="">-- выбрать категорию --</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Новая категория */}
      <input
        name="newCategory"
        value={formState.newCategory || ""}
        onChange={handleChange}
        placeholder="Новая категория"
        disabled={!!formState.categoryId && formState.categoryId !== ""}
        className="w-full rounded-xl border px-4 py-3 text-base disabled:bg-gray-100 disabled:text-gray-400"
      />

      {/* Загрузка файлов */}
      <div>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="w-full rounded-xl border px-4 py-3 text-base"
        />

        {previewImages.length > 0 && (
          <div className="flex gap-3 mt-3 overflow-x-auto md:grid md:grid-cols-4 md:gap-4 md:overflow-visible">
            {previewImages.map((url, i) => (
              <div
                key={url + i}
                className="relative flex-shrink-0 w-28 h-28 md:w-full md:h-28"
              >
                <Image
                  src={url}
                  alt={`image-${i}`}
                  width={120}
                  height={120}
                  className="object-cover rounded-lg w-full h-full"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  aria-label="Удалить изображение"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex flex-col md:flex-row gap-3">
        <button
          type="submit"
          disabled={pending || previewImages.length === 0}
          className="flex-1 rounded-xl border px-4 py-3 text-base bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {pending ? "Сохранение..." : initial ? "Обновить товар" : "Создать товар"}
        </button>

        {initial && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border px-4 py-3 text-base bg-gray-100 hover:bg-gray-200"
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
