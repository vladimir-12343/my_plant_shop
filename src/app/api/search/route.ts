// app/api/search/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").trim()
  const take = Number(searchParams.get("limit") ?? 12)

  if (q.length < 2) {
    return NextResponse.json({ products: [], total: 0, pages: [] })
  }

  const where: Prisma.ProductWhereInput = {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ],
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take,
      orderBy: { id: "desc" },
      select: { 
        id: true, 
        name: true, 
        price: true, 
        discount: true,   // 👈 добавили скидку
        coverImage: true 
      },
    }),
    prisma.product.count({ where }),
  ])

  return NextResponse.json({ products: items, total, pages: [] })
}
