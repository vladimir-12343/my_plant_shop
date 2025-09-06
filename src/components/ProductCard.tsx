"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";

export interface ProductCardProduct {
  id: number;
  name: string;
  price: number; // в копейках/центах
  discount?: number | null;
  coverImage?: string | null;
  stock?: number | null;
  images?: string[] | null;
}

export interface ProductCardProps {
  product: ProductCardProduct;
  mode?: "shop" | "admin";
  onEdit?: (product: ProductCardProduct) => void;
}

// 👇 единый fallback (Cloudinary URL)
const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dqeusirkr/image/upload/v1757154692/product-placeholder-wp_zzdg2j.jpg";

export default function ProductCard({
  product,
  mode = "shop",
  onEdit,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  // 👇 безопасно выбираем главное изображение
  const primaryImage = (() => {
    const c = product.coverImage?.trim() ?? "";
    if (c && c.startsWith("http")) return c; // Cloudinary URL

    const arr = Array.isArray(product.images) ? product.images : [];
    const firstValid = arr.find(
      (u) =>
        typeof u === "string" && u.trim().length > 0 && u.startsWith("http")
    );

    return firstValid || FALLBACK_IMAGE;
  })();

  const discount = product.discount ?? 0;
  const hasDiscount = discount > 0;
  const oldPrice = product.price;
  const newPrice = hasDiscount
    ? Math.round(product.price * (1 - discount / 100))
    : product.price;

  async function handleDelete() {
    if (!confirm("Удалить товар?")) return;
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
    else alert("Ошибка при удалении");
  }

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
      {/* Картинка как ссылка */}
      <Link
        href={`/shop/${product.id}`}
        className="relative aspect-square bg-gray-100 block"
      >
        <Image
          src={primaryImage}
          alt={product.name || "Товар"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
          priority={false}
        />
        {hasDiscount && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}
      </Link>

      {/* Контент */}
      <div className="p-4 flex flex-col flex-1">
        <Link href={`/shop/${product.id}`}>
          <h3 className="font-bold text-lg hover:underline line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Цена */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-green-700 font-bold text-xl">
            {(newPrice / 100).toFixed(2)} ₽
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">
              {(oldPrice / 100).toFixed(2)} ₽
            </span>
          )}
        </div>

        {/* Кнопки */}
        {mode === "shop" ? (
          <button
            onClick={() =>
              addToCart({
                id: product.id,
                name: product.name,
                price: newPrice,
                coverImage: primaryImage,
                quantity: 1,
                stock: product.stock ?? 0,
              })
            }
            disabled={!product.stock || product.stock <= 0}
            className="mt-4 w-full bg-green-700 hover:bg-green-800 text-white py-2 rounded transition-colors disabled:opacity-50"
          >
            {product.stock && product.stock > 0 ? "В корзину" : "Нет в наличии"}
          </button>
        ) : (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => onEdit?.(product)}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded transition-colors"
            >
              Редактировать
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded transition-colors"
            >
              Удалить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
