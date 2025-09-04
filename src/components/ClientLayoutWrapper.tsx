// src/components/ClientLayoutWrapper.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import Header from "./Header"
import Footer from "./Footer"
import CartDrawer from "./CartDrawer"

type Props = { children: React.ReactNode }

export default function ClientLayoutWrapper({ children }: Props) {
  const headerRef = useRef<HTMLElement | null>(null)
  const [headerH, setHeaderH] = useState(0)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const measure = () => {
      const h = Math.round(el.getBoundingClientRect().height || 0)
      setHeaderH(h)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)

    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  return (
    <>
      {/* Фиксированная шапка */}
      <Header ref={headerRef} />

      {/* Дроуэр поверх всего */}
      <CartDrawer />

      {/* Прокладка на высоту шапки, чтобы контент не наезжал */}
      <div style={{ height: headerH }} aria-hidden="true" />

      <main>{children}</main>
      <Footer />
    </>
  )
}
