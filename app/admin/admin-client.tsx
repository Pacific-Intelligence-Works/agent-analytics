"use client";

import Link from "next/link";
import { useState } from "react";

interface Row {
  accountId: string;
  domain: string;
  status: string;
  userEmail: string | null;
  lastSyncedAt: string | null;
  syncError: string | null;
}

export default function AdminClient({
  adminEmail,
  rows,
}: {
  adminEmail: string;
  rows: Row[];
}) {
  const [linkByEmail, setLinkByEmail] = useState<Record<string, string>>({});
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  async function getLink(email: string) {
    setLoadingEmail(email);
    setError(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate link");
      setLinkByEmail((prev) => ({ ...prev, [email]: data.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingEmail(null);
    }
  }

  async function copyLink(email: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail((v) => (v === email ? null : v)), 1500);
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? rows.filter(
        (r) =>
          r.domain.toLowerCase().includes(q) ||
          (r.userEmail?.toLowerCase().includes(q) ?? false)
      )
    : rows;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
            <p className="mt-1 text-sm text-gray-500">
              Signed in as{" "}
              <span className="font-medium text-gray-700">{adminEmail}</span>.
              Open sign-in links in a private window so you don&apos;t clobber
              your admin session.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="mb-4">
          <input
            type="search"
            placeholder="Filter by domain or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-sm rounded-md border border-gray-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-700">Domain</th>
                <th className="px-4 py-3 font-medium text-gray-700">Owner</th>
                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 font-medium text-gray-700">
                  Last synced
                </th>
                <th className="px-4 py-3 font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-400"
                  >
                    No accounts match.
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const url = r.userEmail ? linkByEmail[r.userEmail] : undefined;
                return (
                  <tr key={r.accountId}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {r.domain}
                      {r.syncError && (
                        <span
                          className="ml-2 inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700"
                          title={r.syncError}
                        >
                          sync error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {r.userEmail ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.lastSyncedAt
                        ? new Date(r.lastSyncedAt).toLocaleString()
                        : "never"}
                    </td>
                    <td className="px-4 py-3">
                      {r.userEmail ? (
                        url ? (
                          <div className="flex items-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-600 hover:underline"
                            >
                              open
                            </a>
                            <button
                              onClick={() => copyLink(r.userEmail!, url)}
                              className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                            >
                              {copiedEmail === r.userEmail ? "copied" : "copy"}
                            </button>
                            <span className="text-xs text-gray-400">
                              expires 10m
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => getLink(r.userEmail!)}
                            disabled={loadingEmail === r.userEmail}
                            className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                          >
                            {loadingEmail === r.userEmail
                              ? "..."
                              : "Get sign-in link"}
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-gray-400">no owner</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    connected: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    disconnected: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs ${
        colors[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
