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
import { AGENT_COLORS } from "@/lib/cloudflare/bots";

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

interface DetailRow {
  date: string;
  botName: string;
  requestCount: number;
}

interface PathDetailChartProps {
  data: DetailRow[];
  days: number;
}

export function PathDetailChart({ data, days }: PathDetailChartProps) {
  const agents = [...new Set(data.map((d) => d.botName))];

  // Pivot by date
  const byDate = new Map<string, Record<string, number | string>>();
  for (const row of data) {
    const rec = byDate.get(row.date) || { date: row.date };
    rec[row.botName] = (Number(rec[row.botName]) || 0) + row.requestCount;
    byDate.set(row.date, rec);
  }

  // Fill in every date in the range
  const allDates = generateDateRange(days);
  const chartData = allDates.map((date) => byDate.get(date) || { date });

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-400">
        Crawl Activity Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
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
              fontSize: "12px",
            }}
            labelFormatter={(v) =>
              new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })
            }
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />
          {agents.map((agent) => (
            <Line
              key={agent}
              type="monotone"
              dataKey={agent}
              stroke={AGENT_COLORS[agent] || "#a855f7"}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
