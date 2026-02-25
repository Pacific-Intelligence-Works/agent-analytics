import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAccountWithConnection, getAllPathsByAccount } from "@/lib/db/queries";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { AllPagesTable } from "./all-pages-table";

export default async function AllPagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ accountId: string }>;
  searchParams: Promise<{ days?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { accountId } = await params;
  const sp = await searchParams;
  const days = Math.min(Number(sp.days) || 7, 30);

  const account = await getAccountWithConnection(accountId, session.user.id);
  if (!account) redirect("/dashboard");

  const allPaths = await getAllPathsByAccount(accountId, days);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/dashboard/${accountId}${days !== 7 ? `?days=${days}` : ""}`}
            className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <DateRangePicker currentDays={days} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">All Crawled Pages</h1>
        <p className="mt-1 text-sm text-gray-400">
          {allPaths.length.toLocaleString()} pages crawled by AI agents — last{" "}
          {days} days
        </p>
      </div>

      <AllPagesTable paths={allPaths} accountId={accountId} days={days} />
    </div>
  );
}
