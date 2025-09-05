import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config(); // Cloudinary возьмёт ключи из process.env.CLOUDINARY_URL

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Нет файлов" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploaded: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "products" }, (err, result) => {
            if (err || !result) reject(err);
            else resolve(result);
          })
          .end(buffer);
      });

      urls.push(uploaded.secure_url);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Ошибка загрузки:", err);
    return NextResponse.json({ error: "Ошибка загрузки файла" }, { status: 500 });
  }
}
