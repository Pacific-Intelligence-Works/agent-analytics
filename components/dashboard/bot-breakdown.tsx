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

function OrgTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { org: string; requests: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const { org, requests } = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-gray-900">{org}</p>
      <p className="text-xs text-gray-500">{requests.toLocaleString()} requests</p>
    </div>
  );
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
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-400">No agent data yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-4 text-sm font-medium text-gray-500">
        Requests by Organization
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, data.length * 36)}
      >
        <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis
            type="category"
            dataKey="org"
            stroke="#9ca3af"
            fontSize={12}
            width={80}
          />
          <Tooltip
            content={<OrgTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
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
