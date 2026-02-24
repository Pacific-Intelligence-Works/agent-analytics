import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { syncAccount } from "@/lib/cloudflare/sync";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;

  // Verify user owns this account
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id))
    );
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Accept optional lookback days (default 30 — Cloudflare's max retention)
  let lookbackDays = 30;
  try {
    const body = await request.json();
    if (body.days && Number(body.days) > 0) {
      lookbackDays = Math.min(Number(body.days), 30);
    }
  } catch {
    // No body or invalid JSON — use default 30
  }

  try {
    const result = await syncAccount(accountId, lookbackDays);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Sync failed",
      },
      { status: 500 }
    );
  }
}
