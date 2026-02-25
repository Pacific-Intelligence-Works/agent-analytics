"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { SetupShell } from "@/components/setup/setup-shell";
import { CheckCircle, Loader2 } from "lucide-react";

const PROVIDERS = [
  "Akamai",
  "AWS CloudFront",
  "Fastly",
  "Vercel",
  "Netlify",
  "Other",
];

export default function UnsupportedPage({
  params,
}: {
  params: Promise<{ accountId: string }>;
}) {
  const { accountId } = use(params);
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [notify, setNotify] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleProvider(p: string) {
    setSelected((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) return;
    setIsLoading(true);
    try {
      await fetch("/api/unsupported", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, providers: selected, notify }),
      });
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (submitted) {
    return (
      <SetupShell
        step={1}
        totalSteps={4}
        title="Thanks for letting us know"
        accountId={accountId}
      >
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
          <div>
            <p className="font-medium text-green-700">Request recorded</p>
            <p className="mt-1 text-sm text-green-600">
              {notify
                ? "We'll notify you when we add support for your provider."
                : "We'll use this to prioritize future integrations."}
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Back to dashboard
        </button>
      </SetupShell>
    );
  }

  return (
    <SetupShell
      step={1}
      totalSteps={4}
      title="Which provider do you use?"
      accountId={accountId}
      backHref={`/dashboard/${accountId}/setup/check`}
    >
      <form onSubmit={handleSubmit}>
        <p className="mb-4 text-sm text-gray-500">
          Agent Analytics currently supports Cloudflare. Let us know which
          provider you use so we can prioritize adding support.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProvider(p)}
              className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                selected.includes(p)
                  ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Email (optional)
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-emerald-600"
          />
        </div>

        <label className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
          />
          Notify me when my provider is supported
        </label>

        <button
          type="submit"
          disabled={isLoading || selected.length === 0}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </SetupShell>
  );
}
