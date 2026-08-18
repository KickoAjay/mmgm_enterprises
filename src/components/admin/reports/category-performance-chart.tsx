"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatINR } from "@/features/products/format";
import type { CategoryPerformancePoint } from "@/features/admin/reports";

export function CategoryPerformanceChart({
  data,
}: {
  data: CategoryPerformancePoint[];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 24 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          angle={-30}
          textAnchor="end"
          interval={0}
          height={50}
        />
        <YAxis
          tickFormatter={(value: number) => formatINR(value)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={64}
        />
        <Tooltip
          contentStyle={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 0,
            fontSize: 12,
          }}
          formatter={(value) => [formatINR(Number(value)), "Revenue"]}
        />
        <Bar
          dataKey="revenue"
          fill="var(--brand-emerald)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
