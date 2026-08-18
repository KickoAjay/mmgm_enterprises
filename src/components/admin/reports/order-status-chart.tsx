"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { StatusBreakdownPoint } from "@/features/admin/reports";

const SLICE_COLORS = [
  "var(--primary)",
  "var(--brand-rose)",
  "var(--brand-emerald)",
  "var(--brand-mustard)",
  "var(--brand-terracotta)",
  "var(--brand-plum)",
  "var(--brand-champagne)",
  "var(--brand-dusty-pink)",
  "var(--brand-burgundy)",
];

export function OrderStatusChart({ data }: { data: StatusBreakdownPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell
              key={entry.status}
              fill={SLICE_COLORS[i % SLICE_COLORS.length]}
            />
          ))}
        </Pie>
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          wrapperStyle={{ fontSize: 11, lineHeight: "1.6em" }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--background)",
            border: "1px solid var(--border)",
            borderRadius: 0,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
