import { auth } from "@/lib/auth";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/** Returns the session if the caller is an admin, else null. */
export async function requireAdmin() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) return null;
  return session;
}
