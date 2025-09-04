import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const c = await cookies()
    const email = c.get("userEmail")?.value

    if (!email) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { address, country } = await req.json()

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
