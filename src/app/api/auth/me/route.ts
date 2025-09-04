import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const c = await cookies();

  const isAdmin = c.get("admin")?.value === "1";
  const userEmail = c.get("userEmail")?.value || null;
  const adminLastPage = c.get("admin_last_page")?.value || null;

  return NextResponse.json({
    admin: isAdmin,
    userEmail,
    adminLastPage,
  });
}
