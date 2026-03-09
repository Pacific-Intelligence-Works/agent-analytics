import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { detectCloudflare } from "@/lib/cloudflare/detect";
import { SetupShell } from "@/components/setup/setup-shell";
import { CheckResult } from "./check-result";
import { BackButton } from "./back-button";
import { canAccessAccount } from "@/lib/db/queries";

export default async function SetupCheckPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId } = await params;

  const access = await canAccessAccount(accountId, session.user.id);
  if (!access.hasAccess) redirect("/dashboard");

  const [account] = await db
    .select()
    .from(accounts)
    .where(eq(accounts.id, accountId));
  if (!account) redirect("/dashboard");

  const result = await detectCloudflare(account.domain);

  return (
    <SetupShell
      step={1}
      totalSteps={4}
      title="Setup Agent Analytics"
      accountId={accountId}
      backAction={<BackButton accountId={accountId} />}
    >
      <CheckResult
        domain={account.domain}
        isCloudflare={result.isCloudflare}
        method={result.method}
        accountId={accountId}
      />
    </SetupShell>
  );
}
