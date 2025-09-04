import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

// 🔧 генерация slug из названия
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// PATCH /api/admin/products/[id]
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const raw = await req.json();
    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }
    const body = raw as Record<string, unknown>;

    const data: Prisma.ProductUpdateInput = {};

    // name + slug
    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
      data.slug = slugify(body.name);
    }

    // price
    if (typeof body.price === "number") {
      data.price = body.price;
    } else if (typeof body.price === "string" && body.price !== "") {
      data.price = Number(body.price);
    }

    // compareAtPrice
    if (body.compareAtPrice === null) {
      data.compareAtPrice = null;
    } else if (typeof body.compareAtPrice === "number") {
      data.compareAtPrice = body.compareAtPrice;
    } else if (typeof body.compareAtPrice === "string" && body.compareAtPrice !== "") {
      data.compareAtPrice = Number(body.compareAtPrice);
    }

    // stock
    if (typeof body.stock === "number") {
      data.stock = body.stock;
    } else if (typeof body.stock === "string" && body.stock !== "") {
      data.stock = Number(body.stock);
    }

    // sku
    if (typeof body.sku === "string") {
      data.sku = body.sku || null;
    }

    // description
    if (typeof body.description === "string") {
      data.description = body.description || null;
    }

    // discount
    if (typeof body.discount === "number") {
      data.discount = body.discount;
    } else if (typeof body.discount === "string" && body.discount !== "") {
      data.discount = Number(body.discount);
    }

    // images (relation)
    if (Array.isArray(body.images) && body.images.every((i) => typeof i === "string")) {
      const images = body.images as string[];

      data.images = {
        deleteMany: {}, // очистить старые изображения
        create: images.map((url, index) => ({
          url,
          sortOrder: index,
        })),
      };

      // если coverImage не передан, берём первую картинку
      if (!body.coverImage && images.length > 0) {
        data.coverImage = images[0];
      }
    }

    // coverImage (если передан явно)
    if (typeof body.coverImage === "string") {
      data.coverImage = body.coverImage;
    }

    // category (relation)
    if (typeof body.categoryId === "number") {
      data.category = { connect: { id: body.categoryId } };
    } else if (typeof body.categoryId === "string" && body.categoryId !== "") {
      data.category = { connect: { id: Number(body.categoryId) } };
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    // инвалидация путей
    revalidatePath("/admin/products");
    revalidatePath("/");
    revalidatePath(`/shop/${id}`);

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при обновлении",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
