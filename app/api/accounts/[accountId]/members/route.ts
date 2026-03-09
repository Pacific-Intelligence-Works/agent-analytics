import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountMembers, accounts, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canAccessAccount } from "@/lib/db/queries";
import { Resend } from "resend";

/** List all members of an account */
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
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Get owner
  const [account] = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(eq(accounts.id, accountId));

  const [owner] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, account.userId));

  // Get members
  const members = await db
    .select({
      id: accountMembers.id,
      role: accountMembers.role,
      createdAt: accountMembers.createdAt,
      userId: users.id,
      email: users.email,
      name: users.name,
    })
    .from(accountMembers)
    .innerJoin(users, eq(users.id, accountMembers.userId))
    .where(eq(accountMembers.accountId, accountId));

  return NextResponse.json({
    owner: { ...owner, role: "owner" },
    members,
    isOwner: access.isOwner,
  });
}

/** Add a member by email */
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
    return NextResponse.json(
      { error: "Only the account owner can add members" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Find user by email
  const [targetUser] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email));

  if (!targetUser) {
    return NextResponse.json(
      {
        error:
          "No account found for that email. They need to sign up at agentanalytics.unusual.ai first.",
      },
      { status: 404 }
    );
  }

  // Check they're not the owner
  const [account] = await db
    .select({ userId: accounts.userId, domain: accounts.domain })
    .from(accounts)
    .where(eq(accounts.id, accountId));

  if (targetUser.id === account.userId) {
    return NextResponse.json(
      { error: "That user is already the owner of this account" },
      { status: 400 }
    );
  }

  // Check if already a member
  const [existing] = await db
    .select({ id: accountMembers.id })
    .from(accountMembers)
    .where(
      and(
        eq(accountMembers.accountId, accountId),
        eq(accountMembers.userId, targetUser.id)
      )
    );

  if (existing) {
    return NextResponse.json(
      { error: "That user already has access to this account" },
      { status: 400 }
    );
  }

  // Add member
  await db.insert(accountMembers).values({
    accountId,
    userId: targetUser.id,
    role: "viewer",
  });

  // Get inviting user's email for the notification
  const [inviter] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.user.id));

  // Send notification email
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailFrom =
      process.env.EMAIL_FROM ||
      "Agent Analytics <support@analytics.unusual.ai>";
    const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/${accountId}`;

    await resend.emails.send({
      from: emailFrom,
      to: targetUser.email,
      subject: `You've been added to ${account.domain} on Agent Analytics`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;"><a href="https://agentanalytics.unusual.ai" style="color: #6b7280; text-decoration: none;">Agent Analytics</a> by Unusual</p>
          <h1 style="font-size: 24px; color: #111827; margin-bottom: 16px;">A dashboard has been shared with you</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 8px;">
            ${inviter?.email || "A teammate"} has given you access to the <strong>${account.domain}</strong> dashboard on Agent Analytics.
          </p>
          <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 32px;">
            You can now view AI agent traffic data, track trends over time, and export reports for this domain.
          </p>
          <a href="${dashboardUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500;">
            Sign in to view dashboard
          </a>
          <p style="font-size: 13px; color: #9ca3af; margin-top: 32px;">
            If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });
  } catch {
    // Don't fail the request if email fails
  }

  return NextResponse.json({ success: true, email: targetUser.email });
}

/** Remove a member */
export async function DELETE(
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

  const body = await request.json();
  const memberId = body.memberId;

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  // Get the membership record
  const [membership] = await db
    .select({ id: accountMembers.id, userId: accountMembers.userId })
    .from(accountMembers)
    .where(
      and(
        eq(accountMembers.id, memberId),
        eq(accountMembers.accountId, accountId)
      )
    );

  if (!membership) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Owner can remove anyone; members can only remove themselves
  if (!access.isOwner && membership.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You can only remove yourself from this account" },
      { status: 403 }
    );
  }

  await db.delete(accountMembers).where(eq(accountMembers.id, memberId));

  return NextResponse.json({ success: true });
}
