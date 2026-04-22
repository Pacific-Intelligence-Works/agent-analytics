import { db } from "@/lib/db";
import {
  accounts,
  connections,
  crawlerSnapshots,
  crawlerPaths,
  accountMembers,
} from "@/lib/db/schema";
import { eq, and, gte, desc, sql, inArray, or } from "drizzle-orm";

function daysAgoStr(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
}

/**
 * Extensions we treat as static assets (JS, CSS, images, fonts, media) and
 * hide from the "crawled pages" views — AI bots pull these too, but they're
 * noise for site owners who want to see which real pages got crawled.
 */
const ASSET_EXT_PATTERN =
  "\\.(png|jpe?g|gif|svg|ico|webp|avif|bmp|tiff?|woff2?|ttf|otf|eot|css|js|mjs|map|mp4|webm|ogg|mp3|wav|flac|webmanifest)/?$";

/** SQL predicate: true when crawler_paths.path is NOT a static asset */
function excludeAssets() {
  return sql`${crawlerPaths.path} !~* ${ASSET_EXT_PATTERN}`;
}

/** Check if a user can access an account (owner or member) */
export async function canAccessAccount(
  accountId: string,
  userId: string
): Promise<{ hasAccess: boolean; isOwner: boolean }> {
  // Check ownership first
  const [owned] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
  if (owned) return { hasAccess: true, isOwner: true };

  // Check membership
  const [member] = await db
    .select({ id: accountMembers.id })
    .from(accountMembers)
    .where(
      and(
        eq(accountMembers.accountId, accountId),
        eq(accountMembers.userId, userId)
      )
    );
  return { hasAccess: !!member, isOwner: false };
}

/** Get all accounts a user can access (owned + shared) */
export async function getUserAccessibleAccounts(userId: string) {
  const owned = await db
    .select({
      id: accounts.id,
      domain: accounts.domain,
      status: accounts.status,
      isOwner: sql<boolean>`true`,
    })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const shared = await db
    .select({
      id: accounts.id,
      domain: accounts.domain,
      status: accounts.status,
      isOwner: sql<boolean>`false`,
    })
    .from(accountMembers)
    .innerJoin(accounts, eq(accounts.id, accountMembers.accountId))
    .where(eq(accountMembers.userId, userId));

  return [...owned, ...shared];
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

/** Fetch path time series — per-day request counts for top N paths */
export async function getPathTimeSeries(
  accountId: string,
  days: number = 7,
  limit: number = 20,
  includeAssets = false
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
        gte(crawlerPaths.date, daysAgoStr(days)),
        includeAssets ? undefined : excludeAssets()
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
  days: number = 7,
  limit?: number,
  includeAssets = false
) {
  const q = db
    .select({
      path: crawlerPaths.path,
      totalRequests: sql<number>`sum(${crawlerPaths.requestCount})::int`,
      agentCount: sql<number>`count(distinct ${crawlerPaths.botName})::int`,
    })
    .from(crawlerPaths)
    .where(
      and(
        eq(crawlerPaths.accountId, accountId),
        gte(crawlerPaths.date, daysAgoStr(days)),
        includeAssets ? undefined : excludeAssets()
      )
    )
    .groupBy(crawlerPaths.path)
    .orderBy(desc(sql`sum(${crawlerPaths.requestCount})`));
  return limit ? q.limit(limit) : q;
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

/** Fetch an account with its connection, verifying user has access (owner or member) */
export async function getAccountWithConnection(
  accountId: string,
  userId: string
) {
  const access = await canAccessAccount(accountId, userId);
  if (!access.hasAccess) return null;

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (!account) return null;

  const [connection] = await db
    .select({
      lastSyncedAt: connections.lastSyncedAt,
      syncError: connections.syncError,
    })
    .from(connections)
    .where(eq(connections.accountId, accountId));

  return { ...account, isOwner: access.isOwner, connection: connection || null };
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
