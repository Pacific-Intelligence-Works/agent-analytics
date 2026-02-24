import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAllSnapshotsForExport } from "@/lib/db/queries";

export async function GET(
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

  const snapshots = await getAllSnapshotsForExport(accountId);

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "csv";

  if (format === "json") {
    return new NextResponse(JSON.stringify(snapshots, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${account.domain}-analytics.json"`,
      },
    });
  }

  // CSV format
  const header = "date,bot_name,bot_org,bot_category,request_count,bytes_transferred";
  const rows = snapshots.map(
    (s) =>
      `${s.date},${s.botName},${s.botOrg || ""},${s.botCategory || ""},${s.requestCount},${s.bytesTransferred || 0}`
  );
  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${account.domain}-analytics.csv"`,
    },
  });
}
