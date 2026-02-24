import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, connections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;

  const [account] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(
      and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id))
    );
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [connection] = await db
    .select({
      lastSyncedAt: connections.lastSyncedAt,
      syncError: connections.syncError,
    })
    .from(connections)
    .where(eq(connections.accountId, accountId));

  return NextResponse.json({
    lastSyncedAt: connection?.lastSyncedAt?.toISOString() ?? null,
    syncError: connection?.syncError ?? null,
  });
}
