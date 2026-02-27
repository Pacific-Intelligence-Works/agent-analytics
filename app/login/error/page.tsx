import Link from "next/link";
import { AlertCircle, Bot } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Bot className="h-7 w-7 text-emerald-600" />
          <span className="text-2xl font-bold text-gray-900">Agent Analytics</span>
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Something went wrong
        </h1>
        <p className="text-gray-500">
          There was a problem signing you in. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
