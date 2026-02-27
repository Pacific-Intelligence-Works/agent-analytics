import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import {
  users,
  authAccounts,
  sessions,
  verificationTokens,
} from "@/lib/db/schema";

const emailFrom = process.env.EMAIL_FROM || "Agent Analytics <support@analytics.unusual.ai>";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: authAccounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: emailFrom,
      async sendVerificationRequest({ identifier: email, url }) {
        const { Resend: ResendClient } = await import("resend");
        const resend = new ResendClient(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: emailFrom,
          to: email,
          ...(process.env.ADMIN_BCC_EMAIL && { bcc: process.env.ADMIN_BCC_EMAIL }),
          subject: "Sign into Agent Analytics",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 24px;">Agent Analytics</p>
              <h1 style="font-size: 24px; color: #111827; margin-bottom: 16px;">Sign in to Agent Analytics</h1>
              <p style="font-size: 16px; color: #374151; line-height: 1.5; margin-bottom: 32px;">
                Agent Analytics monitors when AI agents like ChatGPT, Claude, and Perplexity read your website. Click below to sign in.
              </p>
              <a href="${url}" style="display: inline-block; background-color: #111827; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 500;">
                Sign in
              </a>
              <p style="font-size: 13px; color: #9ca3af; margin-top: 32px;">
                If you didn't request this email, you can safely ignore it.
              </p>
              <p style="font-size: 12px; color: #d1d5db; margin-top: 24px;">
                By Unusual
              </p>
            </div>
          `,
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login/error",
  },
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
});
