import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 🔧 функция для генерации slug из названия
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD") // убираем диакритику
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/g, "") // оставляем латиницу и кириллицу
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ✅ Получить все категории
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        subcategories: true, // если у тебя реально есть связь subcategories
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    return NextResponse.json(
      { error: "Не удалось загрузить категории" },
      { status: 500 }
    );
  }
}

// ✅ Создать категорию
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Название категории обязательно" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Ошибка при создании категории:", error);
    return NextResponse.json(
      { error: "Не удалось создать категорию" },
      { status: 500 }
    );
  }
}

// ✅ Обновить категорию (например: PATCH /api/admin/categories?id=1)
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json(
        { error: "ID категории обязателен" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const name = String(body.name || "").trim();

    if (!name) {
      return NextResponse.json(
        { error: "Название обязательно" },
        { status: 400 }
      );
    }

    const slug = slugify(name);

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Ошибка при обновлении категории:", error);
    return NextResponse.json(
      { error: "Не удалось обновить категорию" },
      { status: 500 }
    );
  }
}

// ✅ Удалить категорию (например: DELETE /api/admin/categories?id=1)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json(
        { error: "ID категории обязателен" },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ошибка при удалении категории:", error);
    return NextResponse.json(
      { error: "Не удалось удалить категорию" },
      { status: 500 }
    );
  }
}
