import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-indigo-400" />
        <h1 className="mt-4 text-4xl font-bold text-white">
          Agent Analytics
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          See which AI bots are crawling your website
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-lg bg-indigo-500 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-400"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
