import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DomainForm } from "@/components/setup/domain-form";
import { Globe } from "lucide-react";

export default async function NewDomainPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Globe className="h-6 w-6 text-brand-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">
          Add a new domain
        </h2>
        <p className="mb-8 mt-2 text-gray-500">
          Enter your domain to start tracking AI agent traffic.
        </p>
        <DomainForm />
      </div>
    </div>
  );
}
