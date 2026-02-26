import { Mail, Bot } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          <Bot className="h-7 w-7 text-emerald-600" />
          <h2 className="text-3xl font-bold text-gray-900">Agent Analytics</h2>
        </div>
        <p className="text-xs text-gray-400">
          By{" "}
          <a
            href="https://unusual.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline hover:text-gray-700"
          >
            Unusual
          </a>
        </p>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <Mail className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
        <p className="text-gray-500">
          We sent a magic link to your email address. Click the link to sign in.
        </p>
      </div>
    </div>
  );
}
