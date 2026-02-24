"use client";

import { signOut } from "next-auth/react";
import { BarChart3, LogOut, Plus } from "lucide-react";
import Link from "next/link";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
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
        <p className="px-2 py-4 text-sm text-gray-600">No domains yet</p>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-900 hover:text-white"
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
