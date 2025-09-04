import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "Нет файлов" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = Date.now() + "-" + file.name.replace(/\s/g, "_");
      const filepath = path.join(process.cwd(), "public/uploads", filename);

      await writeFile(filepath, buffer);
      urls.push("/uploads/" + filename);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("Ошибка загрузки:", err);
    return NextResponse.json(
      { error: "Ошибка загрузки файла" },
      { status: 500 }
    );
  }
}
