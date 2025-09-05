// src/app/admin/products/[id]/page.tsx
import prisma from "@/lib/prisma";
import { ProductForm, type Initial as ProductInitial } from "@/components/admin/ProductForm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        sku: true,
        categoryId: true,
        discount: true,
        images: { select: { url: true } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!product) notFound();

  // ⚠️ НЕ кладём поля со значением undefined — просто опускаем их
  const initial: ProductInitial = {
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    price: product.price, // в копейках
    stock: product.stock ?? 0,
    images: product.images.map((i) => i.url),
    ...(product.compareAtPrice != null ? { compareAtPrice: product.compareAtPrice } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.categoryId != null ? { categoryId: product.categoryId } : {}),
    ...(product.discount != null ? { discount: product.discount } : {}),
  };

  return (
    <div className="border rounded-2xl p-4">
      <h2 className="text-lg font-bold mb-4">Редактировать товар</h2>
      <ProductForm initial={initial} categories={categories} />
    </div>
  );
}
