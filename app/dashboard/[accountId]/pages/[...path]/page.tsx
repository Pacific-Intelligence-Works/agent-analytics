import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountWithConnection, getPathDetail } from "@/lib/db/queries";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PathDetailChart } from "./path-detail-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";

export default async function PageDrilldownPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string; path: string[] }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId, path: pathSegments } = await params;
  const sp = await searchParams;
  const days = Math.min(Number(sp.days) || 7, 30);

  const account = await getAccountWithConnection(accountId, session.user.id);
  if (!account) redirect("/dashboard");

  // Reconstruct the path from segments
  const pagePath = "/" + pathSegments.join("/");
  const displayPath = pagePath === "/" ? "Homepage (/)" : pagePath;

  const detail = await getPathDetail(accountId, pagePath, days);

  // Aggregate totals per agent
  const agentTotals = new Map<string, number>();
  for (const row of detail) {
    agentTotals.set(
      row.botName,
      (agentTotals.get(row.botName) || 0) + row.requestCount
    );
  }
  const sortedAgents = [...agentTotals.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  const totalRequests = sortedAgents.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/dashboard/${accountId}${days !== 7 ? `?days=${days}` : ""}`}
            className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <DateRangePicker currentDays={days} />
        </div>
        <h1 className="text-xl font-bold text-white">{account.domain}</h1>
        <p className="mt-1 font-mono text-sm text-indigo-400">{displayPath}</p>
        <p className="mt-1 text-xs text-gray-500">
          {totalRequests.toLocaleString()} total agent requests over last {days}{" "}
          days
        </p>
      </div>

      {detail.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50">
          <p className="text-sm text-gray-500">
            No crawl data for this page in the selected time range.
          </p>
        </div>
      ) : (
        <>
          {/* Chart: crawl activity over time, one line per agent */}
          <PathDetailChart data={detail} days={days} />

          {/* Agent breakdown table */}
          <div className="rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="border-b border-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-400">
                Agent Breakdown
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3 text-right">Requests</th>
                  <th className="px-4 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {sortedAgents.map(([agent, count]) => (
                  <tr
                    key={agent}
                    className="transition-colors hover:bg-gray-800/30"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-300">
                      {agent}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-white">
                      {count.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-400">
                      {totalRequests > 0
                        ? ((count / totalRequests) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
