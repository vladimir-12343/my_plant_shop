"use client";
import useSWR from "swr";
const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function SidebarLowBadge() {
  const { data } = useSWR("/api/admin/low-stock/count", fetcher, { refreshInterval: 60000 });
  const count = data?.count ?? 0;
  if (!count) return null;

  return (
    <span className="ml-2 inline-flex items-center justify-center text-xs rounded-full px-2 py-0.5 bg-red-600 text-white">
      {count}
    </span>
  );
}
