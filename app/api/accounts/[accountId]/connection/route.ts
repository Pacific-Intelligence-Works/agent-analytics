import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, connections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { encrypt } from "@/lib/encryption";
import { canAccessAccount } from "@/lib/db/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;

  const access = await canAccessAccount(accountId, session.user.id);
  if (!access.hasAccess) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  if (!access.isOwner) {
    return NextResponse.json({ error: "Only the account owner can modify the connection" }, { status: 403 });
  }

  const body = await request.json();
  const { zoneId, apiToken } = body;
  if (!zoneId || !apiToken) {
    return NextResponse.json(
      { error: "zoneId and apiToken are required" },
      { status: 400 }
    );
  }

  const apiTokenEnc = encrypt(apiToken);

  // Upsert connection
  const existing = await db
    .select()
    .from(connections)
    .where(eq(connections.accountId, accountId));

  if (existing.length > 0) {
    await db
      .update(connections)
      .set({ zoneId, apiTokenEnc, updatedAt: new Date() })
      .where(eq(connections.accountId, accountId));
  } else {
    await db.insert(connections).values({
      accountId,
      zoneId,
      apiTokenEnc,
    });
  }

  // Update account status
  await db
    .update(accounts)
    .set({ status: "connected", updatedAt: new Date() })
    .where(eq(accounts.id, accountId));

  return NextResponse.json({ success: true });
}

export async function DELETE(
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
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  if (!access.isOwner) {
    return NextResponse.json({ error: "Only the account owner can modify the connection" }, { status: 403 });
  }

  await db.delete(connections).where(eq(connections.accountId, accountId));
  await db
    .update(accounts)
    .set({ status: "disconnected", updatedAt: new Date() })
    .where(eq(accounts.id, accountId));

  return NextResponse.json({ success: true });
}
