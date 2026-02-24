"use client";

import { signOut } from "next-auth/react";
import { BarChart3, LogOut, Plus, Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Account {
  id: string;
  domain: string;
  status: string;
}

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
  accounts: Account[];
}

const STATUS_COLORS: Record<string, string> = {
  connected: "bg-green-400",
  pending: "bg-yellow-400",
  error: "bg-red-400",
  disconnected: "bg-gray-500",
};

export function Sidebar({ user, accounts }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-800 bg-gray-950">
      <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-4">
        <BarChart3 className="h-6 w-6 text-indigo-400" />
        <span className="text-lg font-semibold text-white">
          Agent Analytics
        </span>
      </div>

      <nav className="flex-1 overflow-auto p-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Domains
        </div>

        {accounts.length === 0 ? (
          <p className="px-2 py-4 text-sm text-gray-600">No domains yet</p>
        ) : (
          <ul className="space-y-1">
            {accounts.map((account) => {
              const isActive = pathname.startsWith(
                `/dashboard/${account.id}`
              );
              return (
                <li key={account.id}>
                  <Link
                    href={`/dashboard/${account.id}`}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-gray-800/70 text-white"
                        : "text-gray-400 hover:bg-gray-900 hover:text-white"
                    }`}
                  >
                    <Globe className="h-4 w-4 shrink-0 text-gray-500" />
                    <span className="flex-1 truncate">{account.domain}</span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${STATUS_COLORS[account.status] || "bg-gray-500"}`}
                      title={account.status}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <Link
          href="/dashboard"
          className="mt-2 flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Add domain
        </Link>
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="mb-2 truncate text-sm text-gray-400">
          {user.email}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
