import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyToken, testZoneAccess } from "@/lib/cloudflare/verify";

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

  const body = await request.json();
  const { zoneId, apiToken } = body;
  if (!zoneId || !apiToken) {
    return NextResponse.json(
      { error: "zoneId and apiToken are required" },
      { status: 400 }
    );
  }

  // Step 1: Verify token is active
  const tokenResult = await verifyToken(apiToken);
  if (!tokenResult.valid) {
    return NextResponse.json(
      { valid: false, error: tokenResult.error },
      { status: 200 }
    );
  }

  // Step 2: Test zone access with a small query
  const zoneResult = await testZoneAccess(apiToken, zoneId);
  if (!zoneResult.valid) {
    return NextResponse.json(
      { valid: false, error: zoneResult.error },
      { status: 200 }
    );
  }

  return NextResponse.json({ valid: true });
}
