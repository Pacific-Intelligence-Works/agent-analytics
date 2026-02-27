"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const identifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    if (!posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (ph) => {
          // Identify immediately on load if session is already available
          if (session?.user?.id && session.user.email) {
            ph.identify(session.user.id, { email: session.user.email });
            identifiedRef.current = session.user.id;
          }
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Identify/reset when session changes after init
  useEffect(() => {
    if (!posthog.__loaded || status === "loading") return;

    if (session?.user?.id && session.user.email) {
      if (identifiedRef.current !== session.user.id) {
        posthog.identify(session.user.id, { email: session.user.email });
        identifiedRef.current = session.user.id;
      }
    } else if (status === "unauthenticated") {
      posthog.reset();
      identifiedRef.current = null;
    }
  }, [session, status]);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
