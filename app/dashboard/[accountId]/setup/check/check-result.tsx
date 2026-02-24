"use client";

import Link from "next/link";
import { CheckCircle, XCircle, ArrowRight } from "lucide-react";

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
  return (
    <div>
      {isCloudflare ? (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-green-900/50 bg-green-950/30 p-4">
          <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
          <div>
            <p className="font-medium text-green-300">
              {domain} uses Cloudflare
            </p>
            <p className="mt-1 text-sm text-green-400/70">
              Detected via{" "}
              {method === "http-header" ? "HTTP headers" : "DNS nameservers"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-yellow-900/50 bg-yellow-950/30 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
          <div>
            <p className="font-medium text-yellow-300">
              We didn&apos;t detect Cloudflare on {domain}
            </p>
            <p className="mt-1 text-sm text-yellow-400/70">
              This tool requires Cloudflare&apos;s analytics API. If you know
              your site uses Cloudflare, you can continue anyway.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {isCloudflare ? (
          <Link
            href={`/dashboard/${accountId}/setup/zone-id`}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
          >
            Continue setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <>
            <Link
              href={`/dashboard/${accountId}/setup/unsupported`}
              className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
            >
              I don&apos;t use Cloudflare
            </Link>
            <Link
              href={`/dashboard/${accountId}/setup/zone-id`}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
            >
              I use Cloudflare — continue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
