import { Mail } from "lucide-react";
import Image from "next/image";

export default function CheckEmailPage() {
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
