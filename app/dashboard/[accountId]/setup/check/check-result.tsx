"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight, Mail, Loader2 } from "lucide-react";

interface CheckResultProps {
  domain: string;
  isCloudflare: boolean;
  method?: string;
  accountId: string;
}

export function CheckResult({
  domain,
  isCloudflare,
  method,
  accountId,
}: CheckResultProps) {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!devEmail.trim()) return;
    setInviteLoading(true);
    setInviteError("");

    try {
      const res = await fetch(`/api/accounts/${accountId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: devEmail.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInviteError(data.error || "Failed to send invite");
        return;
      }
      setInviteSent(true);
    } catch {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div>
      {isCloudflare ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <div>
            <p className="font-medium text-green-700">
              {domain} uses Cloudflare
            </p>
            <p className="mt-1 text-sm text-green-600">
              Detected via{" "}
              {method === "http-header" ? "HTTP headers" : "DNS nameservers"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-700">
              We didn&apos;t detect Cloudflare on {domain}
            </p>
            <p className="mt-1 text-sm text-yellow-600">
              This tool requires Cloudflare&apos;s analytics API. If you know
              your site uses Cloudflare, you can continue anyway.
            </p>
          </div>
        </div>
      )}

      {inviteSent ? (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <div>
            <p className="font-medium text-green-700">Invite sent!</p>
            <p className="mt-1 text-sm text-green-600">
              We sent setup instructions to {devEmail}. They can sign in and
              continue the Cloudflare connection.
            </p>
          </div>
        </div>
      ) : showInviteForm ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter your developer&apos;s email. We&apos;ll send them a link to
            sign in and complete the Cloudflare setup.
          </p>
          <form onSubmit={handleSendInvite} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="dev@company.com"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                disabled={inviteLoading}
              />
            </div>
            <button
              type="submit"
              disabled={inviteLoading || !devEmail.trim()}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {inviteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Send invite"
              )}
            </button>
          </form>
          {inviteError && (
            <p className="text-sm text-red-600">{inviteError}</p>
          )}
          <button
            onClick={() => setShowInviteForm(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row">
          {isCloudflare ? (
            <>
              <Link
                href={`/dashboard/${accountId}/setup/zone-id`}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                Set this up myself
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setShowInviteForm(true)}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <Mail className="h-4 w-4" />
                Send to a developer
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/dashboard/${accountId}/setup/unsupported`}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                I don&apos;t use Cloudflare
              </Link>
              <Link
                href={`/dashboard/${accountId}/setup/zone-id`}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                I use Cloudflare — continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
