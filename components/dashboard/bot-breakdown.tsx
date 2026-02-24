"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAgentFilter } from "./agent-filter-provider";
import { ORG_COLORS } from "@/lib/cloudflare/bots";

interface Snapshot {
  botName: string;
  botOrg: string | null;
  requestCount: number;
}

interface BotBreakdownProps {
  snapshots: Snapshot[];
}

export function BotBreakdown({ snapshots }: BotBreakdownProps) {
  const { disabledAgents } = useAgentFilter();

  const filtered = snapshots.filter((s) => !disabledAgents.has(s.botName));

  const orgMap = new Map<string, number>();
  for (const s of filtered) {
    const org = s.botOrg || "Other";
    orgMap.set(org, (orgMap.get(org) || 0) + s.requestCount);
  }

  const data = [...orgMap.entries()]
    .map(([org, requests]) => ({ org, requests }))
    .sort((a, b) => b.requests - a.requests);

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50">
        <p className="text-sm text-gray-500">No agent data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-400">
        Requests by Organization
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, data.length * 36)}
      >
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" stroke="#6b7280" fontSize={12} />
          <YAxis
            type="category"
            dataKey="org"
            stroke="#6b7280"
            fontSize={12}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [
              Number(value).toLocaleString(),
              "Requests",
            ]}
          />
          <Bar dataKey="requests" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.org}
                fill={ORG_COLORS[entry.org] || "#a855f7"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
