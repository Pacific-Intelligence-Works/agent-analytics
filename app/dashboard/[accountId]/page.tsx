import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getSnapshotsByAccount,
  getPathsByAccount,
  getPathTimeSeries,
  getAccountWithConnection,
} from "@/lib/db/queries";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TrafficChart } from "@/components/dashboard/traffic-chart";
import { BotBreakdown } from "@/components/dashboard/bot-breakdown";
import { AgentBreakdown } from "@/components/dashboard/agent-breakdown";
import { TopPathsTable } from "@/components/dashboard/top-paths-table";
import { PageTrafficChart } from "@/components/dashboard/page-traffic-chart";
import { DashboardActions } from "@/components/dashboard/dashboard-actions";
import { AgentFilterProvider } from "@/components/dashboard/agent-filter-provider";

export default async function AccountDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId } = await params;
  const sp = await searchParams;
  const days = Math.min(Number(sp.days) || 7, 30);

  const account = await getAccountWithConnection(accountId, session.user.id);
  if (!account) redirect("/dashboard");

  // If account isn't connected yet, redirect to setup
  if (account.status === "pending") {
    redirect(`/dashboard/${accountId}/setup/check`);
  }

  const [snapshots, paths, pathTimeSeries] = await Promise.all([
    getSnapshotsByAccount(accountId, days),
    getPathsByAccount(accountId, days, 20),
    getPathTimeSeries(accountId, days, 20),
  ]);

  // Compute summary stats
  const totalRequests = snapshots.reduce((sum, s) => sum + s.requestCount, 0);
  const uniqueAgents = new Set(snapshots.map((s) => s.botName)).size;
  const totalBytes = snapshots.reduce(
    (sum, s) => sum + (s.bytesTransferred || 0),
    0
  );
  const lastSyncedAt = account.connection?.lastSyncedAt ?? null;

  return (
    <AgentFilterProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${account.domain}&sz=32`}
                alt=""
                className="h-5 w-5 rounded"
              />
              <h1 className="text-2xl font-bold text-gray-900">{account.domain}</h1>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              AI agent traffic — last {days} days
            </p>
          </div>
          <DashboardActions accountId={accountId} days={days} />
        </div>

        {/* Sync error banner */}
        {account.connection?.syncError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Sync error: {account.connection.syncError}
          </div>
        )}

        {/* Stats */}
        <StatCards
          totalRequests={totalRequests}
          uniqueBots={uniqueAgents}
          totalBytes={totalBytes}
          lastSyncedAt={lastSyncedAt}
        />

        {snapshots.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="text-center">
              <p className="text-gray-500">No AI agent traffic data yet</p>
              <p className="mt-1 text-sm text-gray-400">
                Click &quot;Sync now&quot; to fetch the latest data from
                Cloudflare.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Agent traffic over time */}
            <TrafficChart snapshots={snapshots} days={days} />

            {/* Agent breakdown + Org breakdown + Top paths */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BotBreakdown snapshots={snapshots} />
              <AgentBreakdown snapshots={snapshots} />
            </div>

            <TopPathsTable paths={paths} accountId={accountId} days={days} />

            {/* Page-level traffic over time */}
            <PageTrafficChart data={pathTimeSeries} days={days} />
          </>
        )}
      </div>
    </AgentFilterProvider>
  );
}
