import LowStockPanel from "@/components/admin/LowStockPanel";

export default async function AdminDashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* ... другие карточки */}
      <section className="border rounded-2xl p-4">
        <h2 className="text-lg font-semibold mb-3">Заканчивающиеся товары</h2>
        <LowStockPanel />
      </section>
    </div>
  );
}