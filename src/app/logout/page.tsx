"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await fetch("/api/auth/logout"); // очищаем куки на сервере
      router.push("/"); // редиректим на главную
    };
    logout();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen text-gray-600">
      <p>Выход из системы...</p>
    </div>
  );
}
