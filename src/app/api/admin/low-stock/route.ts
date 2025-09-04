import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getThreshold() {
  const t = Number(process.env.LOW_STOCK_THRESHOLD ?? 5);
  return Number.isFinite(t) ? t : 5;
}

// GET /api/admin/low-stock
export async function GET() {
  const threshold = getThreshold();
  const items = await prisma.product.findMany({
    where: { stock: { lte: threshold }, /* isActive: true */ },
    orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
      discount: true,
      coverImage: true,
      category: { select: { id: true, name: true } },
    },
    take: 100,
  });

  return NextResponse.json({ threshold, items });
}
