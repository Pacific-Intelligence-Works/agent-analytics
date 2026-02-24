"use client";

import Link from "next/link";
import { useAgentFilter } from "./agent-filter-provider";

interface PathRow {
  path: string;
  botName: string;
  totalRequests: number;
}

interface TopPathsTableProps {
  paths: PathRow[];
  accountId: string;
  days?: number;
}

function displayPath(path: string): string {
  return path === "/" ? "Homepage (/)" : path;
}

export function TopPathsTable({ paths, accountId, days }: TopPathsTableProps) {
  const { disabledAgents } = useAgentFilter();

  const filtered = paths.filter((p) => !disabledAgents.has(p.botName));

  if (filtered.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <p className="text-sm text-gray-400">No path data yet</p>
      </div>
    );
  }

  const daysParam = days && days !== 7 ? `?days=${days}` : "";

  return (
    <div className="flex max-h-[400px] flex-col rounded-xl border border-gray-200 bg-white">
      <div className="shrink-0 border-b border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-500">
          Top Crawled Pages
        </h3>
      </div>
      <div className="overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3 text-right">Requests</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((row, i) => (
              <tr
                key={`${row.path}-${row.botName}-${i}`}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="max-w-xs truncate px-4 py-3 font-mono text-sm">
                  <Link
                    href={`/dashboard/${accountId}/pages${row.path}${daysParam}`}
                    className="text-indigo-600 hover:text-indigo-500"
                    title={row.path}
                  >
                    {displayPath(row.path)}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {row.botName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                  {row.totalRequests.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
