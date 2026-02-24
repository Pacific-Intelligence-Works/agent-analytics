import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Agent Analytics</h1>
          <p className="mt-2 text-gray-400">
            Sign in to monitor your AI bot traffic
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
