import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DomainForm } from "@/components/setup/domain-form";
import { Globe } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, session.user.id))
    .limit(1);

  if (userAccounts.length > 0) {
    redirect(`/dashboard/${userAccounts[0].id}`);
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
          <Globe className="h-6 w-6 text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">
          Welcome to Agent Analytics
        </h2>
        <p className="mb-8 mt-2 text-gray-400">
          Add your first domain to start tracking AI bot traffic.
        </p>
        <DomainForm />
      </div>
    </div>
  );
}
