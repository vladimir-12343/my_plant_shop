// src/app/api/orders/route.ts
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendEmail } from "@/lib/mailer"
import { orderStatusTemplate, adminOrderTemplate } from "@/lib/emailTemplates"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs" // bcrypt/куки — на Node, не edge

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Необходимо войти в аккаунт" }, { status: 401 })
    }

    const body = await req.json()
    const { products, total } = body

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 })
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1) Проверяем остатки
      for (const it of products as Array<any>) {
        const productId = Number(it.productId ?? it.id)
        const qty = Number(it.quantity ?? 1)
        if (!productId || qty <= 0) continue

        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true, name: true },
        })
        if (!product || product.stock < qty) {
          throw new Error(
            `Недостаточно товара "${product?.name ?? productId}". Остаток: ${product?.stock ?? 0}`
          )
        }
      }

      // 2) Создаём заказ
      const created = await tx.order.create({
        data: {
          userId: user.id,
          products,
          total,
          status: "NEW",
        },
        include: { user: true },
      })

      // 3) Резервируем товары
      for (const it of products as Array<any>) {
        const productId = Number(it.productId ?? it.id)
        const qty = Number(it.quantity ?? 1)
        if (!productId || qty <= 0) continue

        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: qty } },
        })
      }

      return created
    })

    // Письма
    if (!process.env["DISABLE_EMAILS"]) {
      if (order.user?.email) {
        await sendEmail(
          order.user.email,
          `Ваш заказ #${order.id} принят`,
          orderStatusTemplate(order.id, "NEW")
        )
      }
      await sendEmail(
        process.env["EMAIL_USER"]!,
        `Новый заказ #${order.id}`,
        adminOrderTemplate(order, "NEW")
      )
    } else {
      console.log("📭 DISABLE_EMAILS=true — письма не отправляем")
    }

    return NextResponse.json(order)
  } catch (e: any) {
    console.error("Ошибка создания заказа:", e)
    return NextResponse.json({ error: e.message || "Ошибка создания заказа" }, { status: 500 })
  }
}
