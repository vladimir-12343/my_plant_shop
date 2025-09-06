import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password } = await req.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Имя, фамилия, почта и пароль обязательны" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: "USER", // по умолчанию всегда юзер
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    })
  } catch (error) {
    console.error("Ошибка регистрации:", error)
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 })
  }
}
