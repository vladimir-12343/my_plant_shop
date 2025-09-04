import { cookies } from "next/headers"
import ClientLayoutWrapper from "./ClientLayoutWrapper"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const c = await cookies()
  const userId = c.get("userId")?.value || ""

  return <ClientLayoutWrapper userId={userId}>{children}</ClientLayoutWrapper>
}
