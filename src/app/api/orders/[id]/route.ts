import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { orderStatusTemplate } from "@/lib/emailTemplates";

type OrderStatus = "NEW" | "IN_PROGRESS" | "READY" | "CANCELLED";

const ALLOWED_STATUSES: OrderStatus[] = ["NEW", "IN_PROGRESS", "READY", "CANCELLED"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 await params
) {
  try {
    const { id } = await params;                     // 👈 ждём params
    const orderId = Number(id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({} as any));
    const nextRaw = body?.status;

    if (typeof nextRaw !== "string") {
      return NextResponse.json({ error: "Не передан статус" }, { status: 400 });
    }

    const next = (nextRaw as string).toUpperCase() as OrderStatus;
    if (!ALLOWED_STATUSES.includes(next)) {
      return NextResponse.json({ error: "Некорректный статус" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    const prev = existing.status as OrderStatus;
    if (prev === next) {
      // Ничего не меняем — возвращаем как есть
      return NextResponse.json(existing);
    }

    // Транзакция: меняем статус + корректируем склад при отмене
    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id: orderId },
        data: { status: next },
        include: { user: true },
      });

      const items = (order.products as any[]) ?? [];

      // Возвращаем остатки на склад только при NEW -> CANCELLED
      if (prev === "NEW" && next === "CANCELLED") {
        for (const it of items) {
          const productId = Number(it.productId ?? it.id);
          const qty = Number(it.quantity ?? 1);
          if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(qty) || qty <= 0) continue;

          await tx.product.update({
            where: { id: productId },
            data: { stock: { increment: qty } },
          });
        }
      }

      return order;
    });

    // Письмо клиенту (можно отключить через DISABLE_EMAILS=1/true)
    const emailsDisabled = ["1", "true", "yes"].includes(String(process.env.DISABLE_EMAILS ?? "").toLowerCase());
    if (!emailsDisabled && updated.user?.email) {
      await sendEmail(
        updated.user.email,
        `Ваш заказ #${updated.id} обновлён`,
        orderStatusTemplate(updated.id, next)
      );
    }

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("Ошибка при обновлении заказа:", e);
    return NextResponse.json(
      { error: e?.message || "Ошибка обновления заказа" },
      { status: 500 }
    );
  }
}
