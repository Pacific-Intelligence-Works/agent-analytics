import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const domain = body.domain?.trim()?.toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  // Strip protocol and trailing slash
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  const [account] = await db
    .insert(accounts)
    .values({
      userId: session.user.id,
      domain: cleanDomain,
      status: "pending",
    })
    .returning();

  return NextResponse.json(account, { status: 201 });
}
