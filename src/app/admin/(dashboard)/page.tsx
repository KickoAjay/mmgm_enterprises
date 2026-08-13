import { getDashboardStats } from "@/features/admin/dashboard";
import { formatINR } from "@/features/products/format";
import { StatCard } from "@/components/admin/stat-card";

export const metadata = {
  title: "Dashboard | MMGM Admin",
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Today's Revenue" value={formatINR(stats.todayRevenue)} />
        <StatCard label="Total Revenue" value={formatINR(stats.totalRevenue)} />
        <StatCard label="Orders" value={stats.totalOrders} />
        <StatCard label="Pending Orders" value={stats.pendingOrders} />
        <StatCard label="Delivered Orders" value={stats.deliveredOrders} />
        <StatCard label="Customers" value={stats.totalCustomers} />
        <StatCard label="Products" value={stats.totalProducts} />
        <StatCard label="Low Stock" value={stats.lowStockCount} />
        <StatCard label="Returns" value={stats.totalReturns} />
        <StatCard label="Refunds" value={stats.totalRefunds} />
      </div>
    </div>
  );
}
