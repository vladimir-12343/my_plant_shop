import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        price: Number(body.price), // ✅ Int, а не Decimal
        coverImage: body.coverImage || null, // ✅ исправил image → coverImage
        discount: body.discount ?? 0,
        isFeatured: body.isFeatured ?? false,
        categoryId: body.categoryId,
      },
    });

    return NextResponse.json({ success: true, product });
  } catch {
    return NextResponse.json(
      { success: false, error: "Ошибка при обновлении товара" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);

    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Ошибка при удалении товара" },
      { status: 500 }
    );
  }
}
