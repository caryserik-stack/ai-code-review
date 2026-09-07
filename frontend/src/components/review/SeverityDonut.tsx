"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { SEVERITY_STYLES } from "@/lib/owasp";

type ReviewItem = {
  type: "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
  severity: string | null;
};

const SEVERITY_HEX: Record<string, string> = {
  CRITICAL: "#dc2626",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#9ca3af",
};

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

type Props = {
  items: ReviewItem[];
};

export function SeverityDonut({ items }: Props) {
  const data = useMemo(() => {
    return SEVERITY_ORDER.map((severity) => ({
      name: severity,
      value: items.filter(
        (i) => i.type === "SECURITY" && i.severity === severity,
      ).length,
    })).filter((d) => d.value > 0);
  }, [items]);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data],
  );

  if (total === 0) return null;

  return (
    <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Security severity breakdown
      </h3>

      <div className="flex items-center gap-4">
        <div className="w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={SEVERITY_HEX[d.name]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} issue${value === 1 ? "" : "s"}`,
                  SEVERITY_STYLES[name]?.label ?? name,
                ]}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid var(--color-border-dark, #e5e7eb)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5">
          {data.map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between text-xs"
            >
              <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: SEVERITY_HEX[d.name] }}
                />
                {SEVERITY_STYLES[d.name]?.label ?? d.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-gray-100 tabular-nums">
                {d.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
