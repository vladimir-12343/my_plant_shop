"use client";

import { useTransition } from "react";

export default function UpdateOrderButton({
  id,
  next,
  children,
}: {
  id: number;
  next: string;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();

  async function update() {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
      headers: { "Content-Type": "application/json" },
    });
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <button
      onClick={update}
      className="bg-green-600 text-white px-3 py-1 rounded mt-2 disabled:opacity-50"
      disabled={isPending}
    >
      {children}
    </button>
  );
}
