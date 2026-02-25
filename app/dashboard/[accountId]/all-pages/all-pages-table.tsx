"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface PathRow {
  path: string;
  totalRequests: number;
  agentCount: number;
}

interface AllPagesTableProps {
  paths: PathRow[];
  accountId: string;
  days: number;
}

function displayPath(path: string): string {
  return path === "/" ? "Homepage (/)" : path;
}

export function AllPagesTable({ paths, accountId, days }: AllPagesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? paths.filter((p) =>
        p.path.toLowerCase().includes(search.toLowerCase())
      )
    : paths;

  function detailHref(path: string): string {
    const params = new URLSearchParams();
    params.set("path", path);
    if (days && days !== 7) params.set("days", String(days));
    return `/dashboard/${accountId}/page-detail?${params.toString()}`;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-gray-400">
            {search ? "No pages match your search" : "No crawled pages yet"}
          </p>
        </div>
      ) : (
        <div className="max-h-[calc(100vh-280px)] overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3">Path</th>
                <th className="px-4 py-3 text-right">Requests</th>
                <th className="px-4 py-3 text-right">Agents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => (
                <tr
                  key={row.path}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="max-w-md truncate px-4 py-3 font-mono text-sm">
                    <Link
                      href={detailHref(row.path)}
                      className="text-indigo-600 hover:text-indigo-500"
                      title={row.path}
                    >
                      {displayPath(row.path)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {row.totalRequests.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
                    {row.agentCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-3">
        <p className="text-xs text-gray-400">
          {filtered.length === paths.length
            ? `${paths.length.toLocaleString()} pages`
            : `${filtered.length.toLocaleString()} of ${paths.length.toLocaleString()} pages`}
        </p>
      </div>
    </div>
  );
}
