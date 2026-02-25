import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface SetupShellProps {
  step: number;
  totalSteps: number;
  title: string;
  accountId: string;
  backHref?: string;
  children: React.ReactNode;
}

export function SetupShell({
  step,
  totalSteps,
  title,
  accountId,
  backHref,
  children,
}: SetupShellProps) {
  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {backHref ? (
            <Link
              href={backHref}
              className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          ) : (
            <div />
          )}
          <span className="text-sm text-gray-400">
            Step {step} of {totalSteps}
          </span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i < step ? "bg-emerald-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-8">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}
