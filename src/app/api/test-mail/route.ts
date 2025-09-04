import { sendEmail } from "@/lib/mailer"

export async function GET() {
  await sendEmail(
    "capustofel@yandex.ru", // отправь себе
    "Тестовое письмо",
    "<h1>Привет!</h1><p>Это тестовое письмо из Rare Plants Shop 🚀</p>"
  )

  return Response.json({ ok: true })
}
