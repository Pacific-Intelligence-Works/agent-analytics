"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export function BackButton({ accountId }: { accountId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleBack() {
    setIsDeleting(true);
    try {
      await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
      router.push("/dashboard");
    } catch {
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleBack}
      disabled={isDeleting}
      className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900 disabled:opacity-50"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ArrowLeft className="h-4 w-4" />
      )}
      Back
    </button>
  );
}
