import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { orderStatusTemplate, adminOrderTemplate } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { products, total } = body; // products: [{ id | productId, quantity }, ...]

    const c = await cookies();
    const email = c.get("userEmail")?.value;

    if (!email) {
      return NextResponse.json({ error: "Необходимо войти в аккаунт" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    // 🔒 транзакция: проверяем остатки → создаём заказ → уменьшаем склад
    const order = await prisma.$transaction(async (tx) => {
      // 1️⃣ Проверяем остатки
      for (const it of products) {
        const productId = Number(it.productId ?? it.id); // 👈 поддержка обоих форматов
        const qty = Number(it.quantity ?? 1);

        if (!productId || qty <= 0) continue;

        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stock: true, name: true },
        });

        if (!product || product.stock < qty) {
          throw new Error(
            `Недостаточно товара "${product?.name ?? productId}". Остаток: ${product?.stock ?? 0}`
          );
        }
      }

      // 2️⃣ Создаём заказ
      const created = await tx.order.create({
        data: {
          userId: user.id,
          products,
          total,
          status: "NEW",
        },
        include: { user: true },
      });

      // 3️⃣ Резервируем товары (уменьшаем stock)
      for (const it of products) {
        const productId = Number(it.productId ?? it.id);
        const qty = Number(it.quantity ?? 1);

        if (!productId || qty <= 0) continue;

        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: qty } },
        });
      }

      return created;
    });

    // ✉️ Отправляем письма (если не отключено)
    if (!process.env["DISABLE_EMAILS"]) {
      // письмо клиенту
      if (order.user?.email) {
        await sendEmail(
          order.user.email,
          `Ваш заказ #${order.id} принят`,
          orderStatusTemplate(order.id, "NEW")
        );
      }

      // письмо админу
      await sendEmail(
        process.env["EMAIL_USER"]!,
        `Новый заказ #${order.id}`,
        adminOrderTemplate(order, "NEW")
      );
    } else {
      console.log("📭 Отправка писем отключена (DISABLE_EMAILS=true)");
    }

    return NextResponse.json(order);
  } catch (e: any) {
    console.error("Ошибка создания заказа:", e);
    return NextResponse.json({ error: e.message || "Ошибка создания заказа" }, { status: 500 });
  }
}
