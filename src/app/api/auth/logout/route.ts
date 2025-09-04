import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ success: true });

  // очищаем куки
  res.cookies.set("admin", "", { expires: new Date(0) });
  res.cookies.set("userEmail", "", { expires: new Date(0) });
  res.cookies.set("admin_last_page", "", { expires: new Date(0) });

  return res;
}
