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
import type { TopSellingPoint } from "@/features/admin/reports";

export function TopSellingChart({ data }: { data: TopSellingPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatINR(value)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 11, fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: string) =>
            value.length > 22 ? `${value.slice(0, 22)}…` : value
          }
        />
        <Tooltip
          contentStyle={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 0,
            fontSize: 12,
          }}
          formatter={(value, name) =>
            name === "revenue"
              ? [formatINR(Number(value)), "Revenue"]
              : [Number(value), "Units Sold"]
          }
        />
        <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
