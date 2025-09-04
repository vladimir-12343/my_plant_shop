import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const dynamic = "force-dynamic";

// 🔑 Серверный action для входа
async function loginAction(formData: FormData) {
  "use server";

  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  // проверяем наличие email и password
  if (!rawEmail || !rawPassword) {
    redirect("/login?e=1");
  }

  const email = String(rawEmail).trim();
  const password = String(rawPassword);

  const c = await cookies();

  // ⚡ Админ (по ENV)
  if (password === process.env.ADMIN_PASSWORD) {
    c.set("admin", "1", { path: "/", httpOnly: true, sameSite: "lax" });
    c.set("userEmail", email, { path: "/", sameSite: "lax" });
    c.set("admin_last_page", "/admin/products", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });

    redirect("/admin/products");
  }

  // ⚡ Обычный пользователь через БД
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    redirect("/login?e=1");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    redirect("/login?e=1");
  }

  c.set("userEmail", email, { path: "/", sameSite: "lax" });
  redirect("/account");
}

// 👇 Обязательный React-компонент для страницы
export default function LoginPage({
  searchParams,
}: {
  searchParams?: { e?: string };
}) {
  const error = searchParams?.e === "1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-wide mb-2">
          LOGIN
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Please enter your e-mail and password:
        </p>

        <form action={loginAction} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            placeholder="Email"
          />
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            placeholder="Password"
          />

          {error && (
            <p className="text-sm text-red-600">Invalid email or password</p>
          )}

          <button
            type="submit"
            className="w-full rounded-md bg-[#c7a17a] hover:bg-[#b8926d] text-white py-2 font-medium transition"
          >
            LOGIN
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-[#c7a17a] hover:underline">
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
