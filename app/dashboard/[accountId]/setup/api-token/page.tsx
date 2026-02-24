"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/setup/setup-shell";
import { ArrowRight, Info, Eye, EyeOff } from "lucide-react";

export default function ApiTokenPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const [apiToken, setApiToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [error, setError] = useState("");

  // Verify we have zoneId from previous step
  useEffect(() => {
    const zoneId = sessionStorage.getItem(`setup_${accountId}_zoneId`);
    if (!zoneId) {
      router.replace(`/dashboard/${accountId}/setup/zone-id`);
    }
  }, [accountId, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiToken.trim();
    if (!trimmed) {
      setError("API token is required");
      return;
    }

    // Store in sessionStorage (never persisted unencrypted)
    sessionStorage.setItem(`setup_${accountId}_apiToken`, trimmed);
    router.push(`/dashboard/${accountId}/setup/verify`);
  }

  return (
    <SetupShell
      step={3}
      totalSteps={4}
      title="Create & enter your API token"
      accountId={accountId}
      backHref={`/dashboard/${accountId}/setup/zone-id`}
    >
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" />
        <div className="text-sm text-gray-500">
          <p className="mb-2 font-medium text-gray-700">
            Create a Cloudflare API token:
          </p>
          <ol className="list-inside list-decimal space-y-1.5">
            <li>
              Go to{" "}
              <span className="font-mono text-indigo-600">
                dash.cloudflare.com/profile/api-tokens
              </span>
            </li>
            <li>
              Click{" "}
              <span className="font-medium text-gray-700">Create Token</span>{" "}
              &rarr;{" "}
              <span className="font-medium text-gray-700">Custom token</span>
            </li>
            <li>
              Set permission:{" "}
              <span className="font-mono text-gray-700">
                Zone &rarr; Analytics &rarr; Read
              </span>
            </li>
            <li>
              Zone Resources:{" "}
              <span className="font-mono text-gray-700">
                Include &rarr; Specific zone &rarr; (your zone)
              </span>
            </li>
            <li>
              Click{" "}
              <span className="font-medium text-gray-700">
                Continue to summary
              </span>{" "}
              &rarr;{" "}
              <span className="font-medium text-gray-700">Create Token</span>
            </li>
            <li>Copy the token and paste it below</li>
          </ol>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <label
          htmlFor="apiToken"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          API Token
        </label>
        <div className="relative">
          <input
            id="apiToken"
            type={showToken ? "text" : "password"}
            value={apiToken}
            onChange={(e) => {
              setApiToken(e.target.value);
              setError("");
            }}
            placeholder="Paste your Cloudflare API token"
            className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 font-mono text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            {showToken ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <p className="mb-4 text-xs text-gray-400">
          Your token will be encrypted before storage and only used to read
          analytics data.
        </p>

        <button
          type="submit"
          disabled={!apiToken.trim()}
          className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </SetupShell>
  );
}
