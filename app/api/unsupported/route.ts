import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { unsupportedProviderRequests } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth();

  const body = await request.json();
  const { email, domain, providers, notify } = body;

  if (!providers || !Array.isArray(providers) || providers.length === 0) {
    return NextResponse.json(
      { error: "At least one provider is required" },
      { status: 400 }
    );
  }

  await db.insert(unsupportedProviderRequests).values({
    userId: session?.user?.id ?? null,
    email: email || session?.user?.email || null,
    domain: domain || null,
    providers,
    notify: notify ?? false,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
