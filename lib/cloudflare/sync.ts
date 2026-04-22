import { db } from "@/lib/db";
import {
  accounts,
  connections,
  crawlerSnapshots,
  crawlerPaths,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { classifyUserAgent, getBotFilterList } from "./bots";

const CF_GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";
const MAX_PATHS_PER_DATE = 50;
/** Cloudflare limits total data retention to ~32 days; cap at 30 */
const MAX_LOOKBACK_DAYS = 30;
/** Cloudflare's max rows per query */
const CF_PAGE_LIMIT = 10000;
/** Max seconds per query window — some zones cap at 691200s (8 days) */
const CF_MAX_WINDOW_SECONDS = 604800; // 7 days

interface SyncResult {
  snapshotsUpserted: number;
  pathsUpserted: number;
}

/** Format a Date as ISO 8601 datetime for CF filters */
function toISOStr(d: Date): string {
  return d.toISOString();
}

/** Advance a datetimeHour string by one hour */
function advanceOneHour(isoStr: string): string {
  const d = new Date(isoStr);
  d.setUTCHours(d.getUTCHours() + 1);
  return toISOStr(d);
}

/**
 * Parse a CF "cannot request data older than <duration>" error and return
 * max seconds, or null. Handles both compact-unit ("1w1d", "4w2d1h32m38s")
 * and plain-seconds ("604800s") formats — the latter is just a compact
 * duration with only the `s` unit, so the same parser covers both.
 */
function parseMaxAgeSeconds(errorMsg: string): number | null {
  const match = errorMsg.match(
    /cannot request data older than ((?:\d+[wdhms])+)/
  );
  if (!match) return null;
  const unitSeconds: Record<string, number> = {
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1,
  };
  let total = 0;
  for (const [, value, unit] of match[1].matchAll(/(\d+)([wdhms])/g)) {
    total += parseInt(value, 10) * unitSeconds[unit];
  }
  return total > 0 ? total : null;
}

/**
 * Minimal probe query — same zone + time filter as the real query, but
 * `limit: 1` and no dimensions, so it's cheap. If CF rejects the time
 * range, it returns the same "cannot request data older than ..." error
 * we'd get from the full query.
 */
function buildProbeQuery(
  zoneId: string,
  start: string,
  end: string
): string {
  return `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        httpRequestsAdaptiveGroups(
          filter: {
            datetimeHour_geq: "${start}"
            datetimeHour_leq: "${end}"
          }
          limit: 1
        ) {
          count
        }
      }
    }
  }`;
}

/**
 * Discover how far back this zone actually allows queries. CF plans vary
 * (Free ~3d, Pro ~7d, Biz/Ent higher) and caps can be tightened per zone,
 * so we probe rather than assume. Returns days with a 1-day safety margin,
 * never less than 1.
 *
 * The probe uses a narrow 1-hour window at the farthest point back we
 * want to reach. This tests CF's *retention* limit (how old data can be)
 * without tripping its *per-query window* limit (how wide the time range
 * can be) — those are two separate constraints and we only care about
 * the former here, since `fetchAll` already chunks into 7-day windows.
 */
async function discoverMaxLookbackDays(
  apiToken: string,
  zoneId: string,
  desiredDays: number
): Promise<number> {
  const capped = Math.min(desiredDays, MAX_LOOKBACK_DAYS);
  const { start } = getDateRange(capped);
  const probeEnd = toISOStr(new Date(new Date(start).getTime() + 3600_000));
  const res = await fetch(CF_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: buildProbeQuery(zoneId, start, probeEnd) }),
  });
  const data = await res.json();
  if (!data.errors?.length) return capped;

  const msg: string = data.errors[0].message ?? "";
  const maxSeconds = parseMaxAgeSeconds(msg);
  if (maxSeconds && maxSeconds > 0) {
    return Math.max(1, Math.floor(maxSeconds / 86400) - 1);
  }
  throw new Error(`CF GraphQL error: ${msg}`);
}

/** Build the date range, capping at Cloudflare's retention limit */
function getDateRange(lookbackDays: number): { start: string; end: string } {
  const capped = Math.min(lookbackDays, MAX_LOOKBACK_DAYS);
  const now = new Date();
  const start = new Date(now.getTime() - capped * 86400000);
  // Round start down to beginning of day
  start.setUTCHours(0, 0, 0, 0);
  return { start: toISOStr(start), end: toISOStr(now) };
}

/** Build the GraphQL query using datetimeHour for granular pagination */
function buildQuery(
  zoneId: string,
  start: string,
  end: string
): string {
  const botFilters = getBotFilterList()
    .map((f) => `{ userAgent_like: "${f}" }`)
    .join("\n            ");

  return `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        httpRequestsAdaptiveGroups(
          filter: {
            datetimeHour_geq: "${start}"
            datetimeHour_leq: "${end}"
            OR: [
              ${botFilters}
            ]
          }
          limit: ${CF_PAGE_LIMIT}
          orderBy: [datetimeHour_ASC]
        ) {
          count
          dimensions {
            datetimeHour
            userAgent
            clientRequestPath
          }
          sum {
            edgeResponseBytes
          }
        }
      }
    }
  }`;
}

interface CfRow {
  count: number;
  dimensions: {
    datetimeHour: string;
    userAgent: string;
    clientRequestPath: string;
  };
  sum: {
    edgeResponseBytes: number;
  };
}

/** Fetch a single page from the CF GraphQL API */
async function fetchPage(
  apiToken: string,
  zoneId: string,
  start: string,
  end: string
): Promise<CfRow[]> {
  const query = buildQuery(zoneId, start, end);
  const res = await fetch(CF_GRAPHQL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();
  if (data.errors?.length) {
    throw new Error(`CF GraphQL error: ${data.errors[0].message}`);
  }

  const zones = data.data?.viewer?.zones;
  if (!zones || zones.length === 0) {
    throw new Error("Zone not found in Cloudflare response");
  }

  return zones[0].httpRequestsAdaptiveGroups || [];
}

/** Split a date range into windows of CF_MAX_WINDOW_SECONDS */
function chunkDateRange(
  start: string,
  end: string
): Array<{ start: string; end: string }> {
  const chunks: Array<{ start: string; end: string }> = [];
  let chunkStart = new Date(start);
  const endDate = new Date(end);

  while (chunkStart < endDate) {
    const chunkEnd = new Date(
      Math.min(
        chunkStart.getTime() + CF_MAX_WINDOW_SECONDS * 1000,
        endDate.getTime()
      )
    );
    chunks.push({ start: toISOStr(chunkStart), end: toISOStr(chunkEnd) });
    chunkStart = chunkEnd;
  }

  return chunks;
}

/**
 * Fetch ALL rows by chunking into time windows (to stay under CF's
 * per-zone time range limit) then paginating each window in 10k increments.
 */
async function fetchAll(
  apiToken: string,
  zoneId: string,
  start: string,
  end: string
): Promise<CfRow[]> {
  const allRows: CfRow[] = [];
  const windows = chunkDateRange(start, end);

  for (const window of windows) {
    let cursor = window.start;

    while (cursor <= window.end) {
      const rows = await fetchPage(apiToken, zoneId, cursor, window.end);
      allRows.push(...rows);

      if (rows.length < CF_PAGE_LIMIT) {
        break;
      }

      // Hit the limit — advance cursor past the data we've received
      const lastHour = rows[rows.length - 1].dimensions.datetimeHour;
      if (lastHour === cursor) {
        // All 10k rows are in the same hour — skip to next hour
        cursor = advanceOneHour(lastHour);
      } else {
        // Re-query from lastHour to pick up any rows we missed
        // on that boundary (upsert deduplicates)
        cursor = lastHour;
      }
    }
  }

  return allRows;
}

/** Sync a single account: query CF → upsert into DB */
export async function syncAccount(
  accountId: string,
  lookbackDays: number = 7
): Promise<SyncResult> {
  // 1. Fetch account + connection
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));
  if (!account) throw new Error(`Account ${accountId} not found`);
  if (account.status !== "connected" && account.status !== "error") {
    throw new Error(
      `Account ${accountId} is not connected (status: ${account.status})`
    );
  }

  const [connection] = await db
    .select()
    .from(connections)
    .where(eq(connections.accountId, accountId));
  if (!connection)
    throw new Error(`No connection for account ${accountId}`);

  try {
    // 2. Decrypt token
    const apiToken = decrypt(connection.apiTokenEnc);

    // 3. Discover how far back this zone actually allows queries, then
    //    fetch within that range. CF plans vary (Free ~3d, Pro ~7d, etc.)
    //    and per-zone caps can be tightened, so we probe instead of assume.
    const effectiveDays = await discoverMaxLookbackDays(
      apiToken,
      connection.zoneId,
      lookbackDays
    );
    if (effectiveDays < lookbackDays) {
      console.log(
        `Zone ${connection.zoneId} capped to ${effectiveDays}d (requested ${lookbackDays}d)`
      );
    }
    const { start, end } = getDateRange(effectiveDays);
    const allRows = await fetchAll(apiToken, connection.zoneId, start, end);

    // 4. Classify and aggregate
    //    datetimeHour → date (YYYY-MM-DD) for storage
    const snapshotMap = new Map<
      string,
      {
        date: string;
        botName: string;
        botOrg: string;
        botCategory: string;
        requestCount: number;
        bytesTransferred: number;
      }
    >();

    const pathMap = new Map<
      string,
      {
        date: string;
        path: string;
        botName: string;
        requestCount: number;
      }
    >();

    for (const row of allRows) {
      const classified = classifyUserAgent(row.dimensions.userAgent);
      if (!classified) continue;

      const { botName, org, category } = classified;
      // Extract date from datetimeHour (e.g. "2026-02-24T14:00:00Z" → "2026-02-24")
      const date = row.dimensions.datetimeHour.split("T")[0];
      const path = row.dimensions.clientRequestPath;

      // Snapshot aggregation by (date, botName)
      const snapKey = `${date}:${botName}`;
      const existing = snapshotMap.get(snapKey);
      if (existing) {
        existing.requestCount += row.count;
        existing.bytesTransferred += row.sum.edgeResponseBytes || 0;
      } else {
        snapshotMap.set(snapKey, {
          date,
          botName,
          botOrg: org,
          botCategory: category,
          requestCount: row.count,
          bytesTransferred: row.sum.edgeResponseBytes || 0,
        });
      }

      // Path aggregation by (date, path, botName)
      if (path) {
        const pathKey = `${date}:${path}:${botName}`;
        const existingPath = pathMap.get(pathKey);
        if (existingPath) {
          existingPath.requestCount += row.count;
        } else {
          pathMap.set(pathKey, {
            date,
            path,
            botName,
            requestCount: row.count,
          });
        }
      }
    }

    // 5. Batch upsert snapshots (chunks of 500 rows per INSERT)
    let snapshotsUpserted = 0;
    const snapValues = [...snapshotMap.values()];
    for (let i = 0; i < snapValues.length; i += 500) {
      const batch = snapValues.slice(i, i + 500);
      await db
        .insert(crawlerSnapshots)
        .values(
          batch.map((snap) => ({
            accountId,
            date: snap.date,
            botName: snap.botName,
            botCategory: snap.botCategory,
            botOrg: snap.botOrg,
            requestCount: snap.requestCount,
            bytesTransferred: snap.bytesTransferred,
          }))
        )
        .onConflictDoUpdate({
          target: [
            crawlerSnapshots.accountId,
            crawlerSnapshots.date,
            crawlerSnapshots.botName,
          ],
          set: {
            requestCount: sql`excluded.request_count`,
            bytesTransferred: sql`excluded.bytes_transferred`,
            botCategory: sql`excluded.bot_category`,
            botOrg: sql`excluded.bot_org`,
          },
        });
      snapshotsUpserted += batch.length;
    }

    // 6. Upsert paths (top N per date)
    const pathsByDate = new Map<
      string,
      (typeof pathMap extends Map<string, infer V> ? V : never)[]
    >();
    for (const p of pathMap.values()) {
      const arr = pathsByDate.get(p.date) || [];
      arr.push(p);
      pathsByDate.set(p.date, arr);
    }

    let pathsUpserted = 0;
    const allTopPaths: typeof pathMap extends Map<string, infer V>
      ? V[]
      : never[] = [];
    for (const [, datePaths] of pathsByDate) {
      datePaths.sort((a, b) => b.requestCount - a.requestCount);
      allTopPaths.push(...datePaths.slice(0, MAX_PATHS_PER_DATE));
    }

    for (let i = 0; i < allTopPaths.length; i += 500) {
      const batch = allTopPaths.slice(i, i + 500);
      await db
        .insert(crawlerPaths)
        .values(
          batch.map((p) => ({
            accountId,
            date: p.date,
            path: p.path,
            botName: p.botName,
            requestCount: p.requestCount,
          }))
        )
        .onConflictDoUpdate({
          target: [
            crawlerPaths.accountId,
            crawlerPaths.date,
            crawlerPaths.path,
            crawlerPaths.botName,
          ],
          set: {
            requestCount: sql`excluded.request_count`,
          },
        });
      pathsUpserted += batch.length;
    }

    // 7. Update connection metadata
    await db
      .update(connections)
      .set({
        lastSyncedAt: new Date(),
        syncError: null,
        updatedAt: new Date(),
      })
      .where(eq(connections.accountId, accountId));

    // Reset account status to connected if it was in error
    if (account.status === "error") {
      await db
        .update(accounts)
        .set({ status: "connected", updatedAt: new Date() })
        .where(eq(accounts.id, accountId));
    }

    return { snapshotsUpserted, pathsUpserted };
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Unknown sync error";

    await db
      .update(connections)
      .set({ syncError: errorMsg, updatedAt: new Date() })
      .where(eq(connections.accountId, accountId));

    await db
      .update(accounts)
      .set({ status: "error", updatedAt: new Date() })
      .where(eq(accounts.id, accountId));

    throw err;
  }
}
