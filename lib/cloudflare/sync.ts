import { db } from "@/lib/db";
import {
  accounts,
  connections,
  crawlerSnapshots,
  crawlerPaths,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/encryption";
import { classifyUserAgent, getBotFilterList } from "./bots";

const CF_GRAPHQL = "https://api.cloudflare.com/client/v4/graphql";
const MAX_PATHS_PER_DATE = 50;
/** Cloudflare limits total data retention to ~32 days; cap at 30 */
const MAX_LOOKBACK_DAYS = 30;

interface SyncResult {
  snapshotsUpserted: number;
  pathsUpserted: number;
}

/** Format a Date as YYYY-MM-DD */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Build the date range, capping at Cloudflare's retention limit */
function getDateRange(lookbackDays: number): { start: string; end: string } {
  const capped = Math.min(lookbackDays, MAX_LOOKBACK_DAYS);
  const now = new Date();
  const start = new Date(now.getTime() - capped * 86400000);
  return { start: toDateStr(start), end: toDateStr(now) };
}

/** Build the GraphQL query for bot traffic data */
function buildQuery(zoneId: string, start: string, end: string): string {
  const botFilters = getBotFilterList()
    .map((f) => `{ userAgent_like: "${f}" }`)
    .join("\n            ");

  return `{
    viewer {
      zones(filter: { zoneTag: "${zoneId}" }) {
        httpRequestsAdaptiveGroups(
          filter: {
            date_geq: "${start}"
            date_leq: "${end}"
            OR: [
              ${botFilters}
            ]
          }
          limit: 10000
          orderBy: [date_ASC]
        ) {
          count
          dimensions {
            date
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
    date: string;
    userAgent: string;
    clientRequestPath: string;
  };
  sum: {
    edgeResponseBytes: number;
  };
}

/** Fetch one chunk from the CF GraphQL API */
async function fetchChunk(
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

    // 3. Build date range and fetch data
    const { start, end } = getDateRange(lookbackDays);
    const allRows = await fetchChunk(
      apiToken,
      connection.zoneId,
      start,
      end
    );

    // 4. Classify and aggregate snapshots: (date, botName) → { count, bytes, org, category }
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

    // 5. Aggregate paths: (date, path, botName) → count
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
      const date = row.dimensions.date;
      const path = row.dimensions.clientRequestPath;

      // Snapshot aggregation
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

      // Path aggregation
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

    // 6. Upsert snapshots
    let snapshotsUpserted = 0;
    for (const snap of snapshotMap.values()) {
      await db
        .insert(crawlerSnapshots)
        .values({
          accountId,
          date: snap.date,
          botName: snap.botName,
          botCategory: snap.botCategory,
          botOrg: snap.botOrg,
          requestCount: snap.requestCount,
          bytesTransferred: snap.bytesTransferred,
        })
        .onConflictDoUpdate({
          target: [
            crawlerSnapshots.accountId,
            crawlerSnapshots.date,
            crawlerSnapshots.botName,
          ],
          set: {
            requestCount: snap.requestCount,
            bytesTransferred: snap.bytesTransferred,
            botCategory: snap.botCategory,
            botOrg: snap.botOrg,
          },
        });
      snapshotsUpserted++;
    }

    // 7. Upsert paths (top N per date)
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
    for (const [, datePaths] of pathsByDate) {
      datePaths.sort((a, b) => b.requestCount - a.requestCount);
      const topPaths = datePaths.slice(0, MAX_PATHS_PER_DATE);

      for (const p of topPaths) {
        await db
          .insert(crawlerPaths)
          .values({
            accountId,
            date: p.date,
            path: p.path,
            botName: p.botName,
            requestCount: p.requestCount,
          })
          .onConflictDoUpdate({
            target: [
              crawlerPaths.accountId,
              crawlerPaths.date,
              crawlerPaths.path,
              crawlerPaths.botName,
            ],
            set: {
              requestCount: p.requestCount,
            },
          });
        pathsUpserted++;
      }
    }

    // 8. Update connection metadata
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

    // Record error on connection and account
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
