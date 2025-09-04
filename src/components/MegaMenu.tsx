"use client"
import Link from "next/link"
import { useState, useRef } from "react"
import Image from "next/image"

type MenuItem = string | { label: string; href: string }

interface Section {
  title: string
  items: MenuItem[]
}

interface MegaMenuProps {
  label: string
  sections: Section[]
  image?: { src: string; alt: string; caption: string }
  className?: string
}

export default function MegaMenu({ label, sections, image, className }: MegaMenuProps) {
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpen(false)
    }, 250) // ⏳ задержка закрытия 250ms
  }

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* кнопка */}
      <button className={className}>{label}</button>

      {/* выпадающее меню */}
      {open && (
        <div className="absolute left-0 mt-2 bg-white shadow-lg border rounded-xl z-50 w-[900px] p-6 grid grid-cols-4 gap-6">
          {/* секции */}
          <div className="col-span-3 grid grid-cols-3 gap-6">
            {sections.map((section, idx) => (
              <div key={idx}>
                <h4 className="font-bold mb-3 text-sm">{section.title}</h4>
                <ul className="space-y-2">
                  {section.items.map((item, i) => {
                    if (typeof item === "string") {
                      return (
                        <li key={i} className="text-gray-600 hover:text-green-700 transition">
                          {item}
                        </li>
                      )
                    }
                    return (
                      <li key={i}>
                        <Link
                          href={item.href}
                          className="text-gray-600 hover:text-green-700 transition"
                        >
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* картинка справа */}
          {image && (
            <div className="col-span-1">
              <Image
                src={image.src}
                alt={image.alt}
                width={300}
                height={300}
                className="w-full rounded-lg object-cover"
              />
              <p className="text-sm text-gray-500 mt-2">{image.caption}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
