"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RefreshCw, Loader2, XCircle } from "lucide-react";

interface SyncButtonProps {
  accountId: string;
}

type SyncState = "idle" | "syncing" | "error";

export function SyncButton({ accountId }: SyncButtonProps) {
  const [state, setState] = useState<SyncState>("idle");
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncStartedAt = useRef<string | null>(null);
  const isSyncing = useRef(false);

  const cleanup = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    isSyncing.current = false;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  async function handleSync() {
    if (isSyncing.current) return;
    isSyncing.current = true;
    setState("syncing");
    setError(null);

    // Record the current lastSyncedAt before starting
    try {
      const statusRes = await fetch(
        `/api/accounts/${accountId}/sync-status`
      );
      const statusData = await statusRes.json();
      syncStartedAt.current = statusData.lastSyncedAt;
    } catch {
      syncStartedAt.current = null;
    }

    // Fire off the sync (returns immediately)
    try {
      const res = await fetch(`/api/accounts/${accountId}/sync`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) {
        setState("error");
        setError(data.error || "Failed to start sync");
        isSyncing.current = false;
        return;
      }
    } catch {
      setState("error");
      setError("Failed to start sync");
      isSyncing.current = false;
      return;
    }

    // Poll every 5 seconds for up to 10 minutes
    let attempts = 0;
    const maxAttempts = 120;

    intervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/accounts/${accountId}/sync-status`);
        const data = await res.json();

        if (
          data.lastSyncedAt &&
          data.lastSyncedAt !== syncStartedAt.current
        ) {
          cleanup();
          window.location.reload();
          return;
        }

        if (data.syncError) {
          cleanup();
          setState("error");
          setError(data.syncError);
          return;
        }
      } catch {
        // Network error on poll — keep trying
      }

      if (attempts >= maxAttempts) {
        cleanup();
        setState("error");
        setError("Sync is taking longer than expected. Try refreshing the page.");
      }
    }, 5000);
  }

  function handleDismiss() {
    setState("idle");
  }

  function handleClose() {
    cleanup();
    setState("idle");
    setError(null);
  }

  return (
    <>
      <button
        onClick={handleSync}
        disabled={state === "syncing"}
        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Sync now
      </button>

      {/* Sync modal */}
      {state !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            {state === "syncing" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Syncing data from Cloudflare
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This can take up to 10 minutes. Feel free to check back
                    later.
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {state === "error" && (
              <div className="flex flex-col items-center gap-4 text-center">
                <XCircle className="h-10 w-10 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Sync failed
                  </h3>
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
