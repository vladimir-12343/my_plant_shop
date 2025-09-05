import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const c = cookies() // ✅ без await
    const email = (await c).get("userEmail")?.value

    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Ожидаем JSON от клиента
    const body = await req.json()
    const address: string | null = body.address ?? null
    const country: string | null = body.country ?? null

    const user = await prisma.user.update({
      where: { email },
      data: { address, country },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Ошибка обновления адреса:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
