"use client"

import { useEffect, useRef, useState } from "react"
import Header from "./Header"
import Footer from "./Footer"
import CartDrawer from "./CartDrawer"

export default function ClientLayoutWrapper({
  children,
  userId,
}: {
  children: React.ReactNode
  userId: string
}) {
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener("resize", updateHeight)
    return () => window.removeEventListener("resize", updateHeight)
  }, [])

  return (
    <>
      <Header ref={headerRef} />
      <CartDrawer userId={userId} />
      <main style={{ paddingTop: headerHeight }}>{children}</main>
      <Footer />
    </>
  )
}
