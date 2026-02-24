"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useAgentFilter } from "./agent-filter-provider";
import { ORG_COLORS } from "@/lib/cloudflare/bots";

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

interface Snapshot {
  date: string;
  botName: string;
  botOrg: string | null;
  requestCount: number;
}

interface TrafficChartProps {
  snapshots: Snapshot[];
  days: number;
}

export function TrafficChart({ snapshots, days }: TrafficChartProps) {
  const { disabledAgents } = useAgentFilter();

  const filtered = snapshots.filter((s) => !disabledAgents.has(s.botName));

  const orgs = [...new Set(filtered.map((s) => s.botOrg || "Other"))];
  const byDate = new Map<string, Record<string, number | string>>();

  for (const s of filtered) {
    const org = s.botOrg || "Other";
    const row = byDate.get(s.date) || { date: s.date };
    row[org] = (Number(row[org]) || 0) + s.requestCount;
    byDate.set(s.date, row);
  }

  // Fill in every date in the range, even if no data exists
  const allDates = generateDateRange(days);
  const data = allDates.map((date) => byDate.get(date) || { date });

  const orgTotals = orgs.map((org) => ({
    org,
    total: filtered
      .filter((s) => (s.botOrg || "Other") === org)
      .reduce((sum, s) => sum + s.requestCount, 0),
  }));
  orgTotals.sort((a, b) => b.total - a.total);
  const sortedOrgs = orgTotals.map((o) => o.org);

  if (filtered.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-400">No agent traffic data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-500">
        AI Agent Traffic Over Time
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            fontSize={12}
            tickFormatter={(v) =>
              new Date(String(v) + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
            }
          />
          <YAxis stroke="#9ca3af" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
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
          <Legend wrapperStyle={{ fontSize: "12px", color: "#6b7280" }} />
          {sortedOrgs.map((org) => (
            <Area
              key={org}
              type="monotone"
              dataKey={org}
              stackId="1"
              stroke={ORG_COLORS[org] || "#a855f7"}
              fill={ORG_COLORS[org] || "#a855f7"}
              fillOpacity={0.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
