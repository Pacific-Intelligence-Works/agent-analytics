"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Distinct colors for up to 20 lines
const LINE_COLORS = [
  "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#14b8a6", "#a855f7",
  "#84cc16", "#6366f1", "#d946ef", "#64748b", "#22d3ee",
  "#fb923c", "#4ade80", "#f43f5e", "#2dd4bf", "#c084fc",
];

interface PathTimeSeriesRow {
  date: string;
  path: string;
  requestCount: number;
}

interface PageTrafficChartProps {
  data: PathTimeSeriesRow[];
  days: number;
}

function displayPath(path: string, maxLen: number = 30): string {
  if (path === "/") return "Homepage (/)";
  if (path.length <= maxLen) return path;
  return path.slice(0, maxLen - 1) + "…";
}

/** Generate every YYYY-MM-DD string for the last N days */
function generateDateRange(days: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function PageTrafficChart({ data, days }: PageTrafficChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50">
        <p className="text-sm text-gray-500">No page-level traffic data yet</p>
      </div>
    );
  }

  // Get unique paths (ordered by total requests)
  const pathTotals = new Map<string, number>();
  for (const row of data) {
    pathTotals.set(row.path, (pathTotals.get(row.path) || 0) + row.requestCount);
  }
  const paths = [...pathTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);

  // Pivot: group by date, one key per path
  const byDate = new Map<string, Record<string, number | string>>();
  for (const row of data) {
    const rec = byDate.get(row.date) || { date: row.date };
    rec[row.path] = (Number(rec[row.path]) || 0) + row.requestCount;
    byDate.set(row.date, rec);
  }

  // Fill in every date in the range
  const allDates = generateDateRange(days);
  const chartData = allDates.map((date) => byDate.get(date) || { date });

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400">
          Top Pages Crawled Over Time
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(v) =>
              new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "11px",
              maxWidth: "400px",
            }}
            labelFormatter={(v) =>
              new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            }
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
            formatter={(value) => displayPath(String(value))}
          />
          {paths.map((path, i) => (
            <Line
              key={path}
              type="monotone"
              dataKey={path}
              stroke={LINE_COLORS[i % LINE_COLORS.length]}
              strokeWidth={1.5}
              dot={false}
              name={path}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
