import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-indigo-500" />
        <h1 className="mt-4 text-4xl font-bold text-gray-900">
          Agent Analytics
        </h1>
        <p className="mt-2 text-lg text-gray-500">
          See which AI agents are reading your website
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-indigo-500 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-600"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
