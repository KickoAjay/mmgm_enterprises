import { getReportsData } from "@/features/admin/reports";
import { ReportPanel } from "@/components/admin/reports/report-panel";
import { SalesTrendChart } from "@/components/admin/reports/sales-trend-chart";
import { OrderStatusChart } from "@/components/admin/reports/order-status-chart";
import { TopSellingChart } from "@/components/admin/reports/top-selling-chart";
import { CategoryPerformanceChart } from "@/components/admin/reports/category-performance-chart";

export const metadata = {
  title: "Reports",
};

export default async function AdminReportsPage() {
  const {
    dailySales,
    monthlySales,
    orderStatusBreakdown,
    topSellingSarees,
    categoryPerformance,
  } = await getReportsData();

  return (
    <div>
      <h1 className="font-serif text-2xl text-foreground">Reports</h1>

      <div className="mt-8 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ReportPanel title="Daily Sales & Revenue (Last 30 Days)">
          <SalesTrendChart data={dailySales} />
        </ReportPanel>
        <ReportPanel title="Monthly Sales & Revenue Trends (Last 12 Months)">
          <SalesTrendChart data={monthlySales} />
        </ReportPanel>
        <ReportPanel title="Orders by Status">
          <OrderStatusChart data={orderStatusBreakdown} />
        </ReportPanel>
        <ReportPanel title="Category Performance">
          <CategoryPerformanceChart data={categoryPerformance} />
        </ReportPanel>
        <ReportPanel title="Top Selling Sarees" className="xl:col-span-2">
          <TopSellingChart data={topSellingSarees} />
        </ReportPanel>
      </div>
    </div>
  );
}
