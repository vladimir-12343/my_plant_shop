import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { orderStatusTemplate } from "@/lib/emailTemplates";

type OrderStatus = "NEW" | "IN_PROGRESS" | "READY" | "CANCELLED";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();
    const orderId = Number(params.id);

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const prev = existing.status as OrderStatus;
    const next = status as OrderStatus;

    // транзакция: меняем статус + корректируем склад
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: next },
        include: { user: true },
      });

      const items = (order.products as any[]) ?? [];

      // ✅ возврат товара при отмене
      if (prev === "NEW" && next === "CANCELLED") {
        for (const it of items) {
          const productId = Number(it.productId ?? it.id);
          const qty = Number(it.quantity ?? 1);
          if (!productId || qty <= 0) continue;

          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: qty } },
          });
        }
      }

      // ⚡️ При NEW → IN_PROGRESS ничего не делаем,
      // т.к. товар уже был зарезервирован в POST /api/orders

      return order;
    });

    // ✉️ письмо клиенту
    if (!process.env.DISABLE_EMAILS && updated.user?.email) {
      await sendEmail(
        updated.user.email,
        `Ваш заказ #${updated.id} обновлён`,
        orderStatusTemplate(updated.id, next)
      );
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Ошибка при обновлении заказа:", e);
    return NextResponse.json({ error: e.message || "Ошибка обновления заказа" }, { status: 500 });
  }
}
