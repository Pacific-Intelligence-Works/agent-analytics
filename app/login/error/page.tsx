import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">
          Something went wrong
        </h1>
        <p className="text-gray-400">
          There was a problem signing you in. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-indigo-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
