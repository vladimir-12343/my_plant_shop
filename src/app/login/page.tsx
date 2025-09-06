// src/app/login/page.tsx
import LoginPageClient from "@/app/login/LoginPageClient"

export default function LoginPage({ searchParams }: { searchParams?: { error?: string; callbackUrl?: string } }) {
  const error = typeof searchParams?.error === "string" ? searchParams.error : undefined
  const callbackUrl =
    typeof searchParams?.callbackUrl === "string" ? searchParams.callbackUrl : "/account"

  return (
    <LoginPageClient
      callbackUrl={callbackUrl}
      {...(error !== undefined ? { error } : {})} // 👈 проп "error" добавляем только если он есть
    />
  )
}
