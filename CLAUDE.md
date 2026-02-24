# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Analytics — an open-source Next.js web app that connects to Cloudflare's AI Crawl Control analytics via their GraphQL API and displays AI bot traffic data in a marketer-friendly dashboard. Built as a standalone tool and lead generation funnel for Unusual (Pacific Intelligence Works, Inc.).

**Hosted at:** `agentanalytics.unusual.ai`

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Hosting:** Vercel
- **Database:** Vercel Postgres
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js with email magic link (no passwords)
- **Styling:** Tailwind CSS (dark theme, gray-950 bg, indigo-400/500 accent)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Email:** Resend
- **License:** MIT

## Common Commands

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Run Drizzle migrations
npx drizzle-kit push

# Generate Drizzle migrations
npx drizzle-kit generate

# Run a specific migration
npx drizzle-kit migrate
```

## Architecture

The app follows a standard Next.js App Router structure with server-side API routes, Vercel cron jobs for periodic data sync, and a Vercel Postgres database accessed via Drizzle ORM.

**Data flow:** Vercel cron (every 6 hours) → decrypt stored Cloudflare API token → query Cloudflare GraphQL Analytics API per zone → upsert results into `crawler_snapshots` and `crawler_paths` tables → dashboard reads from Postgres.

### Key Modules

- `lib/encryption.ts` — AES-256-GCM encrypt/decrypt for Cloudflare API tokens. Tokens stored as `iv:authTag:ciphertext` (base64, colon-separated). Decryption only happens server-side when making CF API calls.
- `lib/cloudflare/detect.ts` — Auto-detect if a domain uses Cloudflare (via HTTP headers + DNS nameservers).
- `lib/cloudflare/verify.ts` — Verify a Cloudflare API token against `api.cloudflare.com/client/v4/user/tokens/verify`.
- `lib/cloudflare/sync.ts` — Core sync logic: decrypt token → query CF GraphQL → parse user agents → upsert snapshots/paths → update `last_synced_at`.
- `lib/cloudflare/bots.ts` — AI bot registry mapping user agent strings to `{ org, category }` (e.g., GPTBot → OpenAI/ai_crawler).

### Database Tables

- `users` — email-based, created via magic link auth
- `accounts` — one per tracked domain, belongs to a user. Status: pending/connected/error/disconnected
- `connections` — Cloudflare credentials (zone_id + encrypted API token) per account. One-to-one with accounts
- `crawler_snapshots` — aggregated bot traffic data, one row per account/date/bot_name
- `crawler_paths` — top crawled paths per account/date
- `dev_invites` — "send to my developer" invite tokens
- `unsupported_provider_requests` — logs demand for non-Cloudflare platforms

Composite unique constraints: `crawler_snapshots(account_id, date, bot_name)`, `crawler_paths(account_id, date, path, bot_name)`.

### Route Structure

- `/` — Marketing landing page
- `/login`, `/signup` — Auth pages
- `/dashboard/[accountId]` — Main dashboard with charts
- `/dashboard/[accountId]/setup/*` — Multi-step Cloudflare connection wizard (check → unsupported → zone-id → api-token → verify)
- `/dashboard/[accountId]/settings` — Token management, data export
- `/setup/[inviteToken]` — Developer invite entry point
- `/api/cron/sync` — Vercel cron handler (every 6 hours, authorized via `CRON_SECRET`)
- `/api/internal/` — Service-to-service API for Unusual backend (excluded from public repo via .gitignore)

## Important Conventions

- **Cloudflare tokens must never be exposed client-side.** Decrypt only server-side, only when calling CF APIs.
- **`app/api/internal/` is gitignored** — it contains service-to-service endpoints with `INTERNAL_API_KEY` auth, not meant for the public repo.
- **Cron timeout awareness:** Vercel Hobby = 60s, Pro = 300s. Sync processes accounts sequentially with small delays to avoid CF rate limits.
- **Cloudflare GraphQL schema:** Before implementing sync queries, check latest docs at `https://developers.cloudflare.com/ai-crawl-control/reference/` — the API schema for AI crawler fields may use `botManagementDetectionIds` or other specific filters rather than generic bot filters.

## Environment Variables

See `.env.example` for the full list. Key ones:
- `POSTGRES_URL` — Vercel Postgres (auto-populated when linked)
- `NEXTAUTH_SECRET` / `NEXTAUTH_URL` — NextAuth config
- `RESEND_API_KEY` — Transactional email
- `ENCRYPTION_KEY` — 64-char hex string (256 bits) for AES-256-GCM token encryption
- `CRON_SECRET` — Vercel cron authorization
- `INTERNAL_API_KEY` — Service-to-service auth (not in public repo)

## Implementation Phases

The project is built in order: (1) Core infrastructure (Next.js, Postgres, Drizzle, NextAuth), (2) Setup flow (Cloudflare connection wizard), (3) Data sync (CF GraphQL + cron), (4) Dashboard (charts, tables, export), (5) Collaboration (dev invites), (6) Marketing page, (7) Polish + open source prep.
