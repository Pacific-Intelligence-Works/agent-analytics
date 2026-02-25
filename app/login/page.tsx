import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { Bot } from "lucide-react";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Bot className="h-7 w-7 text-emerald-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Agent Analytics
            </h1>
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
          <p className="mt-3 text-sm text-gray-400">
            Sign in to monitor when AI agents read your website.
          </p>
        </div>
        <LoginForm />
        <p className="text-center text-xs text-gray-400">
          By signing up, you agree to our{" "}
          <a href="/legal/terms-of-service" className="text-gray-500 underline hover:text-gray-700">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/legal/privacy-policy" className="text-gray-500 underline hover:text-gray-700">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
