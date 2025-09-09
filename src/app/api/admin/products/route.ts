import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { invalidateProductsCache } from "@/lib/cache"
import { Prisma } from "@prisma/client"

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

// Типы для ответа
type ProductResponse = {
  id: number
  name: string
  price: number
  coverImage: string
  discount: number
  category: { id: number; name: string }
}

type CategoryResponse = {
  id: number
  name: string
  products: Array<{ id: number }>
}

type ApiResponse = {
  success: boolean
  data?: { products: ProductResponse[]; categories: CategoryResponse[] }
  timestamp?: string
  error?: string
  details?: string
}

// ---------- GET /api/admin/products ----------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get("limit")) || 12
  const page = Number(searchParams.get("page")) || 1
  const skip = (page - 1) * limit

  try {
    const [products, categories, totalProducts] = await Promise.all([
      prisma.product.findMany({
        where: { isFeatured: true },
        select: {
          id: true,
          name: true,
          price: true,
          discount: true,
          coverImage: true,
          category: { select: { id: true, name: true } },
        },
        take: limit,
        skip,
        orderBy: { createdAt: "desc" },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, products: { select: { id: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where: { isFeatured: true } }),
    ])

    const formattedProducts: ProductResponse[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      coverImage: p.coverImage || "/images/placeholder-product.jpg",
      discount: p.discount ?? 0,
      category: { id: p.category.id, name: p.category.name },
    }))

    const response: ApiResponse = {
      success: true,
      data: { products: formattedProducts, categories },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "X-Total-Count": String(totalProducts),
        "X-Page": String(page),
        "X-Per-Page": String(limit),
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    })
  } catch (error) {
    console.error("API Error:", error)

    const isDev = process.env.NODE_ENV === "development"
    const details =
      isDev && error instanceof Error
        ? error.message
        : isDev
        ? "Неизвестная ошибка"
        : undefined

    const response: ApiResponse = {
      success: false,
      error: "Ошибка загрузки данных",
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status: 500 })
  }
}

// ---------- POST /api/admin/products ----------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "missing_name" },
        { status: 400 }
      );
    }

    // приводим типы
    const price = Number(body.price);
    const compareAtPrice =
      body.compareAtPrice != null ? Number(body.compareAtPrice) : null;
    const stock = body.stock ?? 0;
    const sku = body.sku ? String(body.sku) : null;
    const description = body.description ? String(body.description) : null;
    const images: string[] = Array.isArray(body.images) ? body.images : [];
    const discount = body.discount ?? 0;
    const isFeatured = body.isFeatured ?? false;

    const categoryIdParsed = Number(body.categoryId);
    const hasCategory = Number.isFinite(categoryIdParsed);

    const coverImage: string | null =
      body.coverImage ?? (images.length ? images[0] : null);

    const slug = slugify(name); // 🔧 генерируем заранее

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        price,
        compareAtPrice,
        stock,
        sku,
        description,
        coverImage,
        discount,
        isFeatured,
        ...(hasCategory ? { category: { connect: { id: categoryIdParsed } } } : {}),
        images: {
          create: images.map((url: string, index: number) => ({
            url,
            sortOrder: index,
          })),
        },
      },
    });

    // ✅ инвалидация кеша
    invalidateProductsCache(product.id);

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    // Диагностика в dev
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.error("Create product error:", error);
    }

    // ✅ Prisma: уникальное ограничение (дубликат)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        // target может быть массивом или строкой (имя индекса)
        const targetRaw = (error as any).meta?.target;
        const targetStr = Array.isArray(targetRaw)
          ? targetRaw.map((t: any) => String(t).toLowerCase()).join(",")
          : String(targetRaw || "").toLowerCase();

        if (isDev) {
          console.error("P2002 target:", targetRaw);
        }

        // считаем дубликатом имени также конфликт по slug
        if (targetStr.includes("name") || targetStr.includes("slug")) {
          return NextResponse.json(
            { success: false, error: "duplicate_name" },
            { status: 400 }
          );
        }

        // иной уникальный конфликт — вернём универсальную ошибку
        return NextResponse.json(
          { success: false, error: "unique_violation", target: targetRaw },
          { status: 400 }
        );
      }
    }

    // ⚠️ Все остальные ошибки
    return NextResponse.json(
      {
        success: false,
        error: "server_error",
        ...(isDev ? { details: String(error) } : {}),
      },
      { status: 500 }
    );
  }
}


