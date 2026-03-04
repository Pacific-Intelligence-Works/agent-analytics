import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Monitor } from "lucide-react";

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
    <>
      {/* Mobile blocking screen */}
      <div className="flex md:hidden h-screen items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Monitor className="h-6 w-6 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Desktop only
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Agent Analytics is designed for larger screens. Please visit on a desktop or laptop to view your dashboard.
          </p>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex h-screen bg-gray-50">
        <Sidebar user={session.user} accounts={userAccounts} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </>
  );
}
