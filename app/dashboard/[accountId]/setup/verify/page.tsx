"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/setup/setup-shell";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

type Status = "idle" | "verifying" | "success" | "error" | "saving";

export default function VerifyPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [apiToken, setApiToken] = useState("");

  useEffect(() => {
    const storedZone = sessionStorage.getItem(`setup_${accountId}_zoneId`);
    const storedToken = sessionStorage.getItem(`setup_${accountId}_apiToken`);
    if (!storedZone || !storedToken) {
      router.replace(`/dashboard/${accountId}/setup/zone-id`);
      return;
    }
    setZoneId(storedZone);
    setApiToken(storedToken);
  }, [accountId, router]);

  const verify = useCallback(async () => {
    if (!zoneId || !apiToken) return;

    setStatus("verifying");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/accounts/${accountId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, apiToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Verification failed");
        return;
      }

      if (!data.valid) {
        setStatus("error");
        setErrorMsg(data.error || "Token is not valid");
        return;
      }

      // Verification passed — save connection
      setStatus("saving");
      const saveRes = await fetch(`/api/accounts/${accountId}/connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, apiToken }),
      });

      if (!saveRes.ok) {
        setStatus("error");
        setErrorMsg("Failed to save connection");
        return;
      }

      // Clear sessionStorage
      sessionStorage.removeItem(`setup_${accountId}_zoneId`);
      sessionStorage.removeItem(`setup_${accountId}_apiToken`);

      // Fire-and-forget: trigger initial sync
      fetch(`/api/accounts/${accountId}/sync`, { method: "POST" });

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }, [accountId, zoneId, apiToken]);

  // Auto-verify on mount once we have credentials
  useEffect(() => {
    if (zoneId && apiToken && status === "idle") {
      verify();
    }
  }, [zoneId, apiToken, status, verify]);

  return (
    <SetupShell
      step={4}
      totalSteps={4}
      title="Verify connection"
      accountId={accountId}
      backHref={`/dashboard/${accountId}/setup/api-token`}
    >
      <div className="space-y-6">
        {(status === "verifying" || status === "saving") && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-600">
              {status === "verifying"
                ? "Verifying your Cloudflare credentials..."
                : "Saving your connection..."}
            </p>
          </div>
        )}

        {status === "success" && (
          <>
            <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
              <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div>
                <p className="font-medium text-green-700">
                  Connection verified and saved
                </p>
                <p className="mt-1 text-sm text-green-600">
                  Syncing your data — this may take a few minutes.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/dashboard/${accountId}`)}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-medium text-red-700">
                  Verification failed
                </p>
                <p className="mt-1 text-sm text-red-600">{errorMsg}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={verify}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                <RotateCcw className="h-4 w-4" />
                Retry
              </button>
              <button
                onClick={() =>
                  router.push(`/dashboard/${accountId}/setup/api-token`)
                }
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Re-enter credentials
              </button>
            </div>
          </>
        )}
      </div>
    </SetupShell>
  );
}
