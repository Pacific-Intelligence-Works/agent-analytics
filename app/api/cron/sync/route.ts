import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, connections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { syncAccount } from "@/lib/cloudflare/sync";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all connected accounts with their connections
  const connectedAccounts = await db
    .select({
      accountId: accounts.id,
      domain: accounts.domain,
    })
    .from(accounts)
    .innerJoin(connections, eq(connections.accountId, accounts.id))
    .where(eq(accounts.status, "connected"));

  let synced = 0;
  let errors = 0;
  const details: { accountId: string; domain: string; status: string; error?: string }[] = [];

  for (const account of connectedAccounts) {
    try {
      const result = await syncAccount(account.accountId);
      synced++;
      details.push({
        accountId: account.accountId,
        domain: account.domain,
        status: "ok",
        ...result,
      });
    } catch (err) {
      errors++;
      details.push({
        accountId: account.accountId,
        domain: account.domain,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Rate limit safety: wait between accounts
    if (connectedAccounts.length > 1) {
      await delay(500);
    }
  }

  return NextResponse.json({ synced, errors, total: connectedAccounts.length, details });
}
