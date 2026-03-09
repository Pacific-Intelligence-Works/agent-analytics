import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { canAccessAccount } from "@/lib/db/queries";
import { syncAccount } from "@/lib/cloudflare/sync";

// Allow up to 5 minutes for background sync on Vercel Pro
export const maxDuration = 300;

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

  // Fire-and-forget: return immediately, run sync in background
  after(async () => {
    try {
      await syncAccount(accountId, lookbackDays);
    } catch {
      // Error is recorded on the connection by syncAccount itself
    }
  });

  return NextResponse.json({ success: true, message: "Sync started" });
}
