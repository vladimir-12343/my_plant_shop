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
  category: {
    id: number;
    name: string;
  };
};

type CategoryResponse = {
  id: number;
  name: string;
  products: Array<{ id: number }>;
};

type ApiResponse = {
  success: boolean;
  data?: {
    products: ProductResponse[];
    categories: CategoryResponse[];
  };
  timestamp?: string;
  error?: string;
  details?: string;
};

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
        select: {
          id: true,
          name: true,
          products: { select: { id: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.product.count({ where: { isFeatured: true } }),
    ]);

    const formattedProducts: ProductResponse[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      coverImage: product.coverImage || "/images/placeholder-product.jpg",
      discount: product.discount ?? 0,
      category: {
        id: product.category.id,
        name: product.category.name,
      },
    }));

    revalidatePath(request.url);

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

    const product = await prisma.product.create({
      data: {
        name,
        slug: slugify(name), // ✅ обязательно
        price: Number(body.price),
        compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
        stock: body.stock ?? 0,
        sku: body.sku || null,
        description: body.description || null,
        coverImage: body.coverImage || null,
        discount: body.discount ?? 0,
        isFeatured: body.isFeatured ?? false,
        categoryId: body.categoryId,
      },
    });

    revalidatePath("/admin");

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось создать товар",
        details:
          process.env.NODE_ENV === "development" ? `${error}` : undefined,
      },
      { status: 500 }
    );
  }
}
