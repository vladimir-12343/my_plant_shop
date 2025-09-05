import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const threshold = Number(process.env["LOW_STOCK_THRESHOLD"] ?? 5);
  const count = await prisma.product.count({
    where: { stock: { lte: threshold } },
  });
  return NextResponse.json({ threshold, count });
}
