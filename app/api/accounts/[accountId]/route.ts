import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessAccount } from "@/lib/db/queries";

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
    return NextResponse.json({ error: "Only the account owner can delete this account" }, { status: 403 });
  }

  // Cascade deletes connections, snapshots, paths, and invites
  await db.delete(accounts).where(eq(accounts.id, accountId));

  return NextResponse.json({ success: true });
}
