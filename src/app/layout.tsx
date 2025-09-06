import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

import { CartProvider } from "../components/CartContext"
import AppLayout from "../components/AppLayout"
import { Providers } from "./providers"  // 👈 импортируем

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Rare Plants Shop",
  description: "Магазин редких растений",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers> {/* 👈 теперь весь App в SessionProvider */}
          <CartProvider>
            <AppLayout>{children}</AppLayout>
          </CartProvider>
        </Providers>
      </body>
    </html>
  )
}
