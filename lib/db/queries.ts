import { db } from "@/lib/db";
import {
  accounts,
  connections,
  crawlerSnapshots,
  crawlerPaths,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql, inArray } from "drizzle-orm";

function daysAgoStr(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
}

/** Fetch crawler snapshots for an account within a date range */
export async function getSnapshotsByAccount(
  accountId: string,
  days: number = 7
) {
  return db
    .select({
      date: crawlerSnapshots.date,
      botName: crawlerSnapshots.botName,
      botOrg: crawlerSnapshots.botOrg,
      botCategory: crawlerSnapshots.botCategory,
      requestCount: crawlerSnapshots.requestCount,
      bytesTransferred: crawlerSnapshots.bytesTransferred,
    })
    .from(crawlerSnapshots)
    .where(
      and(
        eq(crawlerSnapshots.accountId, accountId),
        gte(crawlerSnapshots.date, daysAgoStr(days))
      )
    )
    .orderBy(crawlerSnapshots.date);
}

/** Fetch top crawled paths for an account, aggregated across dates */
export async function getPathsByAccount(
  accountId: string,
  days: number = 7,
  limit: number = 20
) {
  return db
    .select({
      path: crawlerPaths.path,
      botName: crawlerPaths.botName,
      totalRequests: sql<number>`sum(${crawlerPaths.requestCount})::int`,
    })
    .from(crawlerPaths)
    .where(
      and(
        eq(crawlerPaths.accountId, accountId),
        gte(crawlerPaths.date, daysAgoStr(days))
      )
    )
    .groupBy(crawlerPaths.path, crawlerPaths.botName)
    .orderBy(desc(sql`sum(${crawlerPaths.requestCount})`))
    .limit(limit);
}

/** Fetch path time series — per-day request counts for top N paths */
export async function getPathTimeSeries(
  accountId: string,
  days: number = 7,
  limit: number = 20
) {
  // First get top paths by total volume
  const topPaths = await db
    .select({
      path: crawlerPaths.path,
      total: sql<number>`sum(${crawlerPaths.requestCount})::int`,
    })
    .from(crawlerPaths)
    .where(
      and(
        eq(crawlerPaths.accountId, accountId),
        gte(crawlerPaths.date, daysAgoStr(days))
      )
    )
    .groupBy(crawlerPaths.path)
    .orderBy(desc(sql`sum(${crawlerPaths.requestCount})`))
    .limit(limit);

  if (topPaths.length === 0) return [];

  const pathList = topPaths.map((p) => p.path);

  // Get daily data for those paths
  const rows = await db
    .select({
      date: crawlerPaths.date,
      path: crawlerPaths.path,
      requestCount: sql<number>`sum(${crawlerPaths.requestCount})::int`,
    })
    .from(crawlerPaths)
    .where(
      and(
        eq(crawlerPaths.accountId, accountId),
        gte(crawlerPaths.date, daysAgoStr(days)),
        inArray(crawlerPaths.path, pathList)
      )
    )
    .groupBy(crawlerPaths.date, crawlerPaths.path)
    .orderBy(crawlerPaths.date);

  return rows;
}

/** Fetch all crawled paths for an account, aggregated across dates and agents */
export async function getAllPathsByAccount(
  accountId: string,
  days: number = 7
) {
  return db
    .select({
      path: crawlerPaths.path,
      totalRequests: sql<number>`sum(${crawlerPaths.requestCount})::int`,
      agentCount: sql<number>`count(distinct ${crawlerPaths.botName})::int`,
    })
    .from(crawlerPaths)
    .where(
      and(
        eq(crawlerPaths.accountId, accountId),
        gte(crawlerPaths.date, daysAgoStr(days))
      )
    )
    .groupBy(crawlerPaths.path)
    .orderBy(desc(sql`sum(${crawlerPaths.requestCount})`));
}

/** Fetch crawl detail for a specific path — per-day, per-agent breakdown */
export async function getPathDetail(
  accountId: string,
  path: string,
  days: number = 7
) {
  return db
    .select({
      date: crawlerPaths.date,
      botName: crawlerPaths.botName,
      requestCount: crawlerPaths.requestCount,
    })
    .from(crawlerPaths)
    .where(
      and(
        eq(crawlerPaths.accountId, accountId),
        eq(crawlerPaths.path, path),
        gte(crawlerPaths.date, daysAgoStr(days))
      )
    )
    .orderBy(crawlerPaths.date);
}

/** Fetch an account with its connection, verifying user ownership */
export async function getAccountWithConnection(
  accountId: string,
  userId: string
) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

  if (!account) return null;

  const [connection] = await db
    .select({
      lastSyncedAt: connections.lastSyncedAt,
      syncError: connections.syncError,
    })
    .from(connections)
    .where(eq(connections.accountId, accountId));

  return { ...account, connection: connection || null };
}

/** Fetch all snapshots for export (no date limit) */
export async function getAllSnapshotsForExport(accountId: string) {
  return db
    .select({
      date: crawlerSnapshots.date,
      botName: crawlerSnapshots.botName,
      botOrg: crawlerSnapshots.botOrg,
      botCategory: crawlerSnapshots.botCategory,
      requestCount: crawlerSnapshots.requestCount,
      bytesTransferred: crawlerSnapshots.bytesTransferred,
    })
    .from(crawlerSnapshots)
    .where(eq(crawlerSnapshots.accountId, accountId))
    .orderBy(crawlerSnapshots.date, crawlerSnapshots.botName);
}
