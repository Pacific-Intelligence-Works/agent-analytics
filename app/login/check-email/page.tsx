import { Mail } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="w-full max-w-md space-y-6 px-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
          <Mail className="h-8 w-8 text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white">Check your email</h1>
        <p className="text-gray-400">
          We sent a magic link to your email address. Click the link to sign in.
        </p>
      </div>
    </div>
  );
}
