import Link from "next/link";
import { AlertCircle } from "lucide-react";
import Image from "next/image";

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <Image
          src="/logo_w_text.svg"
          alt="Unusual"
          width={120}
          height={22}
          className="mx-auto mb-4"
        />
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
