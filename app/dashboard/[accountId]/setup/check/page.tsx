import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { detectCloudflare } from "@/lib/cloudflare/detect";
import { SetupShell } from "@/components/setup/setup-shell";
import { CheckResult } from "./check-result";

export default async function SetupCheckPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId } = await params;

  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(eq(accounts.id, accountId), eq(accounts.userId, session.user.id))
    );
  if (!account) redirect("/dashboard");

  const result = await detectCloudflare(account.domain);

  return (
    <SetupShell
      step={1}
      totalSteps={4}
      title="Cloudflare Detection"
      accountId={accountId}
      backHref="/dashboard"
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
