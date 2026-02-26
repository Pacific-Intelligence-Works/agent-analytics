"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/setup/setup-shell";
import { ArrowRight, Info } from "lucide-react";

export default function ZoneIdPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const [zoneId, setZoneId] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = zoneId.trim();

    // Validate: 32-character hex string
    if (!/^[a-f0-9]{32}$/i.test(trimmed)) {
      setError("Zone ID must be a 32-character hexadecimal string");
      return;
    }

    // Store in sessionStorage for the next steps
    sessionStorage.setItem(`setup_${accountId}_zoneId`, trimmed);
    router.push(`/dashboard/${accountId}/setup/api-token`);
  }

  return (
    <SetupShell
      step={2}
      totalSteps={4}
      title="Enter your Zone ID"
      accountId={accountId}
      backHref={`/dashboard/${accountId}/setup/check`}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="text-sm text-gray-500">
          <p className="mb-2 font-medium text-gray-700">
            Where to find your Zone ID:
          </p>
          <ol className="list-inside list-decimal space-y-1">
            <li>
              Go to{" "}
              <a
                href="https://dash.cloudflare.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-emerald-600 underline hover:text-emerald-700"
              >
                dash.cloudflare.com
              </a>
            </li>
            <li>Select your domain</li>
            <li>
              Look in the right sidebar under{" "}
              <span className="font-medium text-gray-700">API</span>
            </li>
            <li>
              Copy the{" "}
              <span className="font-medium text-gray-700">Zone ID</span>
            </li>
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="zoneId"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Zone ID
        </label>
        <input
          id="zoneId"
          type="text"
          value={zoneId}
          onChange={(e) => {
            setZoneId(e.target.value);
            setError("");
          }}
          placeholder="e.g. a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
          className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 font-mono text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!zoneId.trim()}
          className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </SetupShell>
  );
}
