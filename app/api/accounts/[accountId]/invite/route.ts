import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts, devInvites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Generate a unique invite token
  const token = randomBytes(32).toString("hex");

  // Insert invite
  await db.insert(devInvites).values({
    accountId,
    devEmail: email,
    devName: body.name || null,
    token,
    status: "pending",
  });

  // Send invite email
  const inviteUrl = `${process.env.NEXTAUTH_URL}/setup/${token}`;
  await resend.emails.send({
    from: "Agent Analytics <noreply@analytics.unusual.ai>",
    to: email,
    bcc: "support@unusual.ai",
    subject: `Set up Agent Analytics for ${account.domain}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">Agent Analytics</p>
        <h1 style="font-size: 24px; color: #111827; margin-bottom: 16px;">You've been invited to set up analytics</h1>
        <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 8px;">
          Someone on your team wants to track AI agent traffic on <strong>${account.domain}</strong> using Agent Analytics.
        </p>
        <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 32px;">
          Click below to sign in and connect the Cloudflare API. You'll need the site's Cloudflare zone ID and an API token with Analytics read permissions.
        </p>
        <a href="${inviteUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500;">
          Complete setup
        </a>
        <p style="font-size: 13px; color: #9ca3af; margin-top: 32px;">
          If you didn't expect this email, you can safely ignore it.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
