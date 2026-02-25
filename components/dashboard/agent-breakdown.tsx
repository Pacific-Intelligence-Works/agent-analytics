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
import { AGENT_COLORS, AI_AGENTS } from "@/lib/cloudflare/bots";

interface Snapshot {
  botName: string;
  botOrg: string | null;
  requestCount: number;
}

interface AgentBreakdownProps {
  snapshots: Snapshot[];
}

const agentDescriptions = new Map(
  AI_AGENTS.map((a) => [a.ua, a.description])
);

function AgentTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { agent: string; requests: number } }> }) {
  if (!active || !payload?.[0]) return null;
  const { agent, requests } = payload[0].payload;
  const desc = agentDescriptions.get(agent);
  return (
    <div className="max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-xs font-medium text-gray-900">{agent}</p>
      <p className="text-xs text-gray-500">{requests.toLocaleString()} requests</p>
      {desc && <p className="mt-1 text-xs leading-snug text-gray-400">{desc}</p>}
    </div>
  );
}

export function AgentBreakdown({ snapshots }: AgentBreakdownProps) {
  const { disabledAgents } = useAgentFilter();

  const filtered = snapshots.filter((s) => !disabledAgents.has(s.botName));

  const agentMap = new Map<string, number>();
  for (const s of filtered) {
    agentMap.set(s.botName, (agentMap.get(s.botName) || 0) + s.requestCount);
  }

  const data = [...agentMap.entries()]
    .map(([agent, requests]) => ({ agent, requests }))
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
        Requests by Agent
      </h3>
      <ResponsiveContainer
        width="100%"
        height={Math.max(200, data.length * 32)}
      >
        <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
          <XAxis type="number" stroke="#9ca3af" fontSize={12} />
          <YAxis
            type="category"
            dataKey="agent"
            stroke="#9ca3af"
            fontSize={11}
            width={100}
          />
          <Tooltip
            content={<AgentTooltip />}
            cursor={{ fill: "rgba(0, 0, 0, 0.04)" }}
          />
          <Bar dataKey="requests" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.agent}
                fill={AGENT_COLORS[entry.agent] || "#a855f7"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
