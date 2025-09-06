import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { invalidateProductsCache } from "@/lib/cache"

// 🔧 генерация slug из названия
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

const toNumber = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN
  return Number.isFinite(n) ? n : undefined
}

// ---------- PATCH /api/admin/products/[id] ----------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 Next 15.3
) {
  try {
    const { id } = await params
    const productId = Number(id)
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 })
    }

    const raw = await req.json()
    if (typeof raw !== "object" || raw === null) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 })
    }
    const body = raw as Record<string, unknown>

    const data: Prisma.ProductUpdateInput = {}

    // name + slug
    if (typeof body["name"] === "string") {
      const name = body["name"].trim()
      if (name) {
        data.name = name
        data.slug = slugify(name)
      }
    }

    // price
    {
      const n = toNumber(body["price"])
      if (n !== undefined) data.price = n
    }

    // compareAtPrice
    if (body["compareAtPrice"] === null) {
      data.compareAtPrice = null
    } else {
      const n = toNumber(body["compareAtPrice"])
      if (n !== undefined) data.compareAtPrice = n
    }

    // stock
    {
      const n = toNumber(body["stock"])
      if (n !== undefined) data.stock = n
    }

    // sku
    if (typeof body["sku"] === "string") {
      const v = body["sku"].trim()
      data.sku = v || null
    }

    // description
    if (typeof body["description"] === "string") {
      const v = body["description"].trim()
      data.description = v || null
    }

    // discount
    if (body["discount"] === null) {
      data.discount = null
    } else {
      const n = toNumber(body["discount"])
      if (n !== undefined) {
        const clamped = Math.max(0, Math.min(100, Math.round(n)))
        data.discount = clamped
      }
    }

    // images
    if (Array.isArray(body["images"])) {
      const urls = body["images"]
        .map((i) => (typeof i === "string" ? i.trim() : ""))
        .filter((u) => u.length > 0)

      const seen = new Set<string>()
      const unique = urls.filter((u) => (seen.has(u) ? false : (seen.add(u), true)))

      if (unique.length > 0) {
        data.images = {
          deleteMany: {},
          create: unique.map((url, index) => ({ url, sortOrder: index })),
        }
      } else {
        data.images = { deleteMany: {} }
      }

      if (typeof body["coverImage"] !== "string") {
        data.coverImage = unique[0] ?? null
      }
    }

    // coverImage
    if (typeof body["coverImage"] === "string") {
      const c = body["coverImage"].trim()
      data.coverImage = c || null
    }

    // category
    if (
      typeof body["categoryId"] === "number" ||
      (typeof body["categoryId"] === "string" && body["categoryId"] !== "")
    ) {
      const cid = toNumber(body["categoryId"])
      if (cid !== undefined) data.category = { connect: { id: cid } }
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
      include: { images: { select: { url: true, sortOrder: true } }, category: true },
    })

    // ✅ инвалидация кеша
    invalidateProductsCache(productId)

    return NextResponse.json({ success: true, product: updated })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "Запись с такими уникальными полями уже существует (например, slug или sku)." },
        { status: 409 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при обновлении",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

// ---------- DELETE /api/admin/products/[id] ----------
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const productId = Number(id)
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid id" }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({ where: { id: productId } })
    if (!existing) {
      return NextResponse.json({ success: false, error: "Товар не найден" }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ])

    // ✅ инвалидация кеша
    invalidateProductsCache(productId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ success: false, error: "Товар уже удалён" }, { status: 404 })
    }
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка удаления",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}
