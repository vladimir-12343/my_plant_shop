import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route" // 👈 путь к твоему NextAuth

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    // Ожидаем JSON от клиента
    const body = await req.json()
    const address: string | null = body.address ?? null
    const country: string | null = body.country ?? null

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: { address, country },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("Ошибка обновления адреса:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
