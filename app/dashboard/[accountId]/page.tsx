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
            <h1 className="text-2xl font-bold text-white">{account.domain}</h1>
            <p className="mt-1 text-sm text-gray-500">
              AI agent traffic — last {days} days
            </p>
          </div>
          <DashboardActions accountId={accountId} days={days} />
        </div>

        {/* Sync error banner */}
        {account.connection?.syncError && (
          <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
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
          <div className="flex h-64 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/50">
            <div className="text-center">
              <p className="text-gray-400">No AI agent traffic data yet</p>
              <p className="mt-1 text-sm text-gray-600">
                Click &quot;Sync now&quot; to fetch the latest data from
                Cloudflare.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Agent traffic over time */}
            <TrafficChart snapshots={snapshots} days={days} />

            {/* Agent breakdown + Top paths */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BotBreakdown snapshots={snapshots} />
              <TopPathsTable paths={paths} accountId={accountId} days={days} />
            </div>

            {/* Page-level traffic over time */}
            <PageTrafficChart data={pathTimeSeries} days={days} />
          </>
        )}
      </div>
    </AgentFilterProvider>
  );
}
