import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

// Типы для ответа
type ProductResponse = {
  id: number;
  name: string;
  price: number;
  coverImage: string;
  discount: number;
  category: { id: number; name: string };
};

type CategoryResponse = {
  id: number;
  name: string;
  products: Array<{ id: number }>;
};

type ApiResponse = {
  success: boolean;
  data?: { products: ProductResponse[]; categories: CategoryResponse[] };
  timestamp?: string;
  error?: string;
  details?: string;
};

// GET /api/admin/products
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 12;
  const page = Number(searchParams.get("page")) || 1;
  const skip = (page - 1) * limit;

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
    ]);

    const formattedProducts: ProductResponse[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      coverImage: p.coverImage || "/images/placeholder-product.jpg",
      discount: p.discount ?? 0,
      category: { id: p.category.id, name: p.category.name },
    }));

    const response: ApiResponse = {
      success: true,
      data: { products: formattedProducts, categories },
      timestamp: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "X-Total-Count": String(totalProducts),
        "X-Page": String(page),
        "X-Per-Page": String(limit),
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("API Error:", error);

    const response: ApiResponse = {
      success: false,
      error: "Ошибка загрузки данных",
      details:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Неизвестная ошибка"
          : undefined,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/admin/products
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Название товара обязательно" },
        { status: 400 }
      );
    }

    // приведение типов
    const price = Number(body.price);
    const compareAtPrice =
      body.compareAtPrice != null ? Number(body.compareAtPrice) : null;
    const stock = body.stock ?? 0;
    const sku = body.sku ? String(body.sku) : null;
    const description = body.description ? String(body.description) : null;
    const images: string[] = Array.isArray(body.images) ? body.images : [];
    const discount = body.discount ?? 0;
    const isFeatured = body.isFeatured ?? false;
    const categoryId = Number(body.categoryId);
    const coverImage: string | null =
      body.coverImage ?? (images.length ? images[0] : null);

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name),
        price,
        compareAtPrice,
        stock,
        sku,
        description,
        coverImage,
        discount,
        isFeatured,
        category: { connect: { id: categoryId } }, // ✅ связь через relation
        images: {
          create: images.map((url: string, index: number) => ({
            url,
            sortOrder: index,
          })),
        },
      },
    });

    // инвалидация страниц
    revalidatePath("/admin/products");
    revalidatePath("/");

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось создать товар",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
