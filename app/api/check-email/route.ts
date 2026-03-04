import { NextRequest, NextResponse } from "next/server";
import { getBlockReason } from "@/lib/blocked-domains";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const reason = getBlockReason(email || "");
  if (reason) {
    return NextResponse.json({ blocked: true, reason }, { status: 200 });
  }
  return NextResponse.json({ blocked: false }, { status: 200 });
}
