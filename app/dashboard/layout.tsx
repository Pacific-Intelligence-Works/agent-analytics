import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userAccounts = session.user.id
    ? await db
        .select({
          id: accounts.id,
          domain: accounts.domain,
          status: accounts.status,
        })
        .from(accounts)
        .where(eq(accounts.userId, session.user.id))
    : [];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={session.user} accounts={userAccounts} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
