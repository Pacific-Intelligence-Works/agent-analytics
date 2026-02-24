import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import Image from "next/image";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <Image
            src="/logo_w_text.svg"
            alt="Unusual"
            width={120}
            height={22}
            className="mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900">Agent Analytics</h1>
          <p className="mt-1 text-lg text-gray-500">By Unusual</p>
          <p className="mt-3 text-sm text-gray-400">
            Sign in to monitor when AI agents read your website.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
