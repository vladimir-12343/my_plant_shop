"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/account", // юзера на аккаунт, админа middleware перенаправит в админку
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-semibold tracking-wide mb-2">
          LOGIN
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Please enter your e-mail and password:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
            placeholder="Email"
          />
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}
