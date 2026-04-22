import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, verificationTokens } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin";

const TOKEN_TTL_MINUTES = 10;

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawEmail = typeof body.email === "string" ? body.email : "";
  const targetEmail = rawEmail.trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, targetEmail));
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET not configured" },
      { status: 500 }
    );
  }

  // Replicate NextAuth's email-provider token format: 32-byte random hex,
  // stored as SHA-256(token + secret). See @auth/core signin/send-token.
  const token = randomBytes(32).toString("hex");
  const hashed = createHash("sha256").update(`${token}${secret}`).digest("hex");
  const expires = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: user.email,
    token: hashed,
    expires,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const params = new URLSearchParams({
    callbackUrl: "/dashboard",
    token,
    email: user.email,
  });
  const url = `${baseUrl}/api/auth/callback/resend?${params.toString()}`;

  console.log(
    `[admin-impersonate] ${session.user?.email} → ${user.email}`
  );

  return NextResponse.json({
    url,
    email: user.email,
    expiresAt: expires.toISOString(),
  });
}
