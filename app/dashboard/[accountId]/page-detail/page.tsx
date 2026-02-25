import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountWithConnection, getPathDetail } from "@/lib/db/queries";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PathDetailChart } from "./path-detail-chart";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";

export default async function PageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ days?: string; path?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId } = await params;
  const sp = await searchParams;
  const days = Math.min(Number(sp.days) || 7, 30);
  const pagePath = sp.path || "/";
  const displayPath = pagePath === "/" ? "Homepage (/)" : pagePath;

  const account = await getAccountWithConnection(accountId, session.user.id);
  if (!account) redirect("/dashboard");

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
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <DateRangePicker currentDays={days} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{account.domain}</h1>
        <p className="mt-1 font-mono text-sm text-indigo-600">{displayPath}</p>
        <p className="mt-1 text-xs text-gray-400">
          {totalRequests.toLocaleString()} total agent requests over last {days}{" "}
          days
        </p>
      </div>

      {detail.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-gray-200 bg-white">
          <p className="text-sm text-gray-400">
            No crawl data for this page in the selected time range.
          </p>
        </div>
      ) : (
        <>
          {/* Chart: crawl activity over time, one line per agent */}
          <PathDetailChart data={detail} days={days} />

          {/* Agent breakdown table */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Agent Breakdown
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3 text-right">Requests</th>
                  <th className="px-4 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedAgents.map(([agent, count]) => (
                  <tr
                    key={agent}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                      {agent}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {count.toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-500">
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
