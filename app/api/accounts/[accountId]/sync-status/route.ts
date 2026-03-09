import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { connections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessAccount } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;

  const access = await canAccessAccount(accountId, session.user.id);
  if (!access.hasAccess) {
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
