"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ArrowRight, Loader2 } from "lucide-react";

export function DomainForm() {
  const router = useRouter();
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = domain.trim();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account");
        return;
      }

      const account = await res.json();
      router.push(`/dashboard/${account.id}/setup/check`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <label
        htmlFor="domain"
        className="mb-2 block text-sm font-medium text-gray-700"
      >
        Enter your domain
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id="domain"
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !domain.trim()}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
