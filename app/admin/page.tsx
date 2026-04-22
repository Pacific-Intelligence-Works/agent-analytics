import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, users, connections } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin";
import AdminClient from "./admin-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await requireAdmin();
  if (!session) notFound();

  const rows = await db
    .select({
      accountId: accounts.id,
      domain: accounts.domain,
      status: accounts.status,
      createdAt: accounts.createdAt,
      userEmail: users.email,
      userId: users.id,
      lastSyncedAt: connections.lastSyncedAt,
      syncError: connections.syncError,
    })
    .from(accounts)
    .leftJoin(users, eq(accounts.userId, users.id))
    .leftJoin(connections, eq(connections.accountId, accounts.id))
    .orderBy(desc(accounts.createdAt));

  return (
    <AdminClient
      adminEmail={session.user?.email ?? ""}
      rows={rows.map((r) => ({
        accountId: r.accountId,
        domain: r.domain,
        status: r.status,
        userEmail: r.userEmail,
        lastSyncedAt: r.lastSyncedAt?.toISOString() ?? null,
        syncError: r.syncError,
      }))}
    />
  );
}
