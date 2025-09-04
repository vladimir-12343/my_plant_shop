// src/components/AppLayout.tsx (или app/layout.tsx — смотри у себя путь)
import ClientLayoutWrapper from "./ClientLayoutWrapper"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
}
