// src/app/api/upload/route.ts
import { NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config() // берёт данные из process.env.CLOUDINARY_URL

async function uploadFileToCloudinary(file: File) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "products", resource_type: "image" }, (err, result) => {
        if (err || !result) reject(err)
        else resolve(result)
      })
      .end(buffer)
  })
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const files = formData.getAll("files") as File[]

    if (!files.length) {
      return NextResponse.json({ error: "Нет файлов" }, { status: 400 })
    }

    const results = []
    for (const file of files) {
      const uploaded = await uploadFileToCloudinary(file)
      results.push({
        url: uploaded.secure_url, // 👈 Cloudinary URL
        public_id: uploaded.public_id,
      })
    }

    return NextResponse.json({ urls: results.map(r => r.url), results })
  } catch (err) {
    console.error("Ошибка загрузки:", err)
    return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 })
  }
}
