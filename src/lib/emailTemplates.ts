// 📧 Шаблон для пользователя (прогресс-бар статуса)
export function orderStatusTemplate(orderId: number, status: string) {
  const steps = [
    { key: "NEW", label: "Новый" },
    { key: "IN_PROGRESS", label: "В работе" },
    { key: "READY", label: "Готов" },
  ]

  const statusLabels: Record<string, string> = {
    NEW: "Ваш заказ принят!",
    IN_PROGRESS: "Ваш заказ в работе",
    READY: "Ваш заказ готов",
  }

  const colors: Record<string, string> = {
    NEW: "#facc15", // yellow
    IN_PROGRESS: "#3b82f6", // blue
    READY: "#22c55e", // green
  }

  return `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="background: #c7a17a; padding: 16px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Rare Plants Shop</h1>
        </div>

        <div style="padding: 24px;">
          <h2 style="margin: 0 0 12px;">${statusLabels[status]}</h2>
          <p>Статус вашего заказа <b>#${orderId}</b> изменился.</p>

          <div style="display: flex; justify-content: space-between; margin: 24px 0;">
            ${steps
              .map((s) => {
                const active =
                  steps.findIndex((st) => st.key === status) >=
                  steps.findIndex((st) => st.key === s.key)
                return `
                  <div style="flex: 1; text-align: center;">
                    <div style="width: 16px; height: 16px; margin: 0 auto 6px;
                      border-radius: 50%; background: ${
                        active ? colors[s.key] : "#d1d5db"
                      };">
                    </div>
                    <div style="font-size: 12px; color: ${
                      active ? colors[s.key] : "#9ca3af"
                    };">
                      ${s.label}
                    </div>
                  </div>
                `
              })
              .join("")}
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/account/orders/${orderId}"
               style="background: #c7a17a; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
              Посмотреть заказ
            </a>
          </div>
        </div>

        <div style="background: #f3f4f6; padding: 12px; text-align: center; font-size: 12px; color: #6b7280;">
          Rare Plants Shop © ${new Date().getFullYear()}<br/>
          Это письмо отправлено автоматически, не отвечайте на него.
        </div>
      </div>
    </div>
  `
}

// 📧 Шаблон для администратора (полная инфа о заказе)
export function adminOrderTemplate(order: any, status: string) {
  const products: Array<{ name: string; quantity: number; price: number }> =
    (order.products as any) || []

  return `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="background: #b91c1c; padding: 16px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">Rare Plants Shop — Админ</h1>
        </div>

        <div style="padding: 24px;">
          <h2 style="margin: 0 0 12px;">Новый заказ #${order.id}</h2>
          <p>Статус: <b>${status}</b></p>

          <h3>Клиент:</h3>
          <ul>
            <li><b>Имя:</b> ${order.user?.firstName ?? ""} ${order.user?.lastName ?? ""}</li>
            <li><b>Email:</b> ${order.user?.email ?? ""}</li>
            <li><b>Страна:</b> ${order.user?.country ?? "не указана"}</li>
            <li><b>Адрес:</b> ${order.user?.address ?? "не указан"}</li>
          </ul>

          <h3>Состав заказа:</h3>
          ${
            products.length > 0
              ? `
            <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Товар</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Кол-во</th>
                  <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Сумма</th>
                </tr>
              </thead>
              <tbody>
                ${products
                  .map(
                    (p) => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${p.name}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${p.quantity}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${(
                      (p.price * p.quantity) /
                      100
                    ).toFixed(2)} ₽</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          `
              : `<p>Нет данных о товарах</p>`
          }

          <p><b>Итого:</b> ${(order.total / 100).toFixed(2)} ₽</p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}"
               style="background: #b91c1c; color: white; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">
              Открыть заказ
            </a>
          </div>
        </div>

        <div style="background: #f3f4f6; padding: 12px; text-align: center; font-size: 12px; color: #6b7280;">
          Rare Plants Shop © ${new Date().getFullYear()}<br/>
          Это уведомление только для администраторов.
        </div>
      </div>
    </div>
  `
}
