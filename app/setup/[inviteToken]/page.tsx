import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { devInvites, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ inviteToken: string }>;
}) {
  const { inviteToken } = await params;

  // Validate the invite token
  const [invite] = await db
    .select()
    .from(devInvites)
    .where(eq(devInvites.token, inviteToken));

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Invalid invite link
          </h1>
          <p className="mt-2 text-gray-500">
            This invite link is invalid or has expired.
          </p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const session = await auth();
  if (!session?.user?.id) {
    // Not logged in — redirect to login with callback
    redirect(`/login?callbackUrl=/setup/${inviteToken}`);
  }

  // Mark invite as opened
  if (invite.status === "pending") {
    await db
      .update(devInvites)
      .set({ status: "opened" })
      .where(eq(devInvites.id, invite.id));
  }

  // Associate user with the account (make them the owner if no owner exists,
  // or just let them access the setup flow)
  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, invite.accountId));

  if (!account) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Account not found
          </h1>
          <p className="mt-2 text-gray-500">
            The account associated with this invite no longer exists.
          </p>
        </div>
      </div>
    );
  }

  // If the current user isn't the account owner, transfer ownership to them
  // so they can complete setup
  if (account.userId !== session.user.id) {
    await db
      .update(accounts)
      .set({ userId: session.user.id, updatedAt: new Date() })
      .where(eq(accounts.id, invite.accountId));
  }

  // Mark invite completed
  await db
    .update(devInvites)
    .set({ status: "completed" })
    .where(eq(devInvites.id, invite.id));

  // Redirect to the setup flow
  redirect(`/dashboard/${invite.accountId}/setup/zone-id`);
}
