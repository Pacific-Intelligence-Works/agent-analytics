# Agent Analytics

**See which AI agents are reading your website.**

Agent Analytics is an open-source dashboard that connects to Cloudflare's AI Crawl Control analytics and shows you exactly which AI bots are visiting your site, how often, and which pages they're reading. Built for marketers, SEOs, and content teams who want visibility into how AI is consuming their content.

**[Start tracking for free at agentanalytics.unusual.ai](https://agentanalytics.unusual.ai)**

## Features

- **AI bot traffic over time** — Stacked area chart showing request volume by organization across 7, 14, or 30-day windows
- **Organization and agent breakdowns** — See which AI companies and individual bots are crawling your site most
- **Top pages table** — Which pages get the most AI traffic, with per-page drilldown views
- **Page-level timelines** — Click into any page to see its AI traffic history by agent
- **Data export** — Download your analytics as CSV or JSON
- **Team collaboration** — Share dashboards with team members via email invite
- **Developer handoff** — Non-technical users can send a setup invite to a developer to complete the Cloudflare connection
- **Automatic sync** — Data refreshes every 6 hours via Cloudflare's GraphQL Analytics API

## How It Works

1. **Sign up** with your work email (passwordless magic link authentication)
2. **Enter your domain** — Agent Analytics auto-detects whether it's on Cloudflare via HTTP headers and DNS
3. **Connect Cloudflare** — Provide your Zone ID and a read-only API token (scoped to `Zone > Analytics > Read`)
4. **View your dashboard** — AI crawler data syncs immediately and refreshes every 6 hours

Your Cloudflare API token is encrypted at rest with AES-256-GCM and only decrypted server-side when querying the Cloudflare API. It is never sent to the browser or exposed in API responses. See [`lib/encryption.ts`](lib/encryption.ts) for the full implementation.

## Tracked Agents

Agent Analytics identifies **14 AI agents** across **8 organizations**:

| Organization | Agents | Category |
|---|---|---|
| OpenAI | GPTBot, ChatGPT-User, OAI-SearchBot | Crawler, Assistant, Search |
| Anthropic | ClaudeBot, Claude-SearchBot, Claude-User | Crawler, Search, Assistant |
| Google | Google-Extended, Google-CloudVertexBot | Crawler |
| Perplexity | PerplexityBot, Perplexity-User | Search, Assistant |
| DeepSeek | DeepSeekBot | Crawler |
| Meta | Meta-ExternalAgent | Crawler |
| Mistral | MistralAI-User | Assistant |
| Apple | Applebot | Assistant |

The agent registry is defined in [`lib/cloudflare/bots.ts`](lib/cloudflare/bots.ts) and can be extended as new AI crawlers emerge.

## Self-Hosting

### Prerequisites

- Node.js 18+
- A PostgreSQL database ([Neon](https://neon.tech) recommended for serverless)
- A [Resend](https://resend.com) account for transactional email
- A [Cloudflare](https://cloudflare.com) account (for the sites you want to track)

### Setup

1. Clone the repository:

```bash
git clone https://github.com/Pacific-Intelligence-Works/agent-analytics.git
cd agent-analytics
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from the example:

```bash
cp .env.example .env
```

4. Configure your environment variables:

```env
# Database (Neon Postgres recommended)
POSTGRES_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=       # Generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Encryption (for Cloudflare API tokens at rest)
ENCRYPTION_KEY=        # Generate: openssl rand -hex 32

# Cron sync authorization
CRON_SECRET=           # Generate: openssl rand -base64 32
```

5. Push the database schema:

```bash
npx drizzle-kit push
```

6. Start the dev server:

```bash
npm run dev
```

### Deploying to Vercel

The app is designed for Vercel with built-in cron support:

- Link your Vercel project to a Neon Postgres database
- Set all environment variables in the Vercel dashboard
- The cron job at `/api/cron/sync` runs every 6 hours automatically (configured in `vercel.json`)

## Architecture

```
Data flow:

Vercel Cron (every 6h)
  -> Decrypt stored Cloudflare API token (AES-256-GCM)
  -> Query Cloudflare GraphQL Analytics API per zone
  -> Parse user agents, classify by bot/org/category
  -> Batch upsert into crawler_snapshots and crawler_paths tables
  -> Dashboard reads from Postgres
```

### Key Modules

| Module | Purpose |
|---|---|
| `lib/encryption.ts` | AES-256-GCM encrypt/decrypt for Cloudflare API tokens |
| `lib/cloudflare/sync.ts` | Core sync logic: paginated GraphQL queries, batch upserts |
| `lib/cloudflare/bots.ts` | AI bot registry with org/category classification and chart colors |
| `lib/cloudflare/detect.ts` | Auto-detect Cloudflare via HTTP headers and DNS nameservers |
| `lib/cloudflare/verify.ts` | Verify Cloudflare API token validity |
| `lib/auth.ts` | NextAuth.js config with magic link email provider |
| `lib/db/schema.ts` | Drizzle ORM schema for all database tables |

### Database Schema

| Table | Purpose |
|---|---|
| `users` | Email-based accounts, created via magic link auth |
| `accounts` | One per tracked domain (status: pending/connected/error/disconnected) |
| `connections` | Cloudflare credentials per account (zone ID + encrypted API token) |
| `crawler_snapshots` | Aggregated bot traffic: one row per account/date/bot_name |
| `crawler_paths` | Top crawled paths per account/date/path/bot_name |
| `account_members` | Team collaboration with role-based access (viewer/admin) |
| `dev_invites` | Developer setup invitation tokens |

### Route Structure

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/login`, `/signup` | Passwordless magic link auth |
| `/dashboard/[accountId]` | Main analytics dashboard |
| `/dashboard/[accountId]/pages/[...path]` | Per-page drilldown |
| `/dashboard/[accountId]/setup/*` | 4-step Cloudflare connection wizard |
| `/dashboard/[accountId]/settings` | Account settings and token management |
| `/setup/[inviteToken]` | Developer invite entry point |
| `/api/cron/sync` | Automated sync (every 6 hours, authorized via CRON_SECRET) |
| `/api/accounts/[accountId]/export` | CSV/JSON data export |

## Security

- **Encryption at rest** — Cloudflare API tokens are encrypted with AES-256-GCM before storage. Each encryption uses a unique random IV and authenticated encryption to prevent tampering. Tokens are decrypted only server-side, only when querying the Cloudflare API.
- **Minimal permissions** — The only Cloudflare permission required is `Zone > Analytics > Read`. Agent Analytics cannot modify your zone, DNS, firewall, or any other Cloudflare settings.
- **Passwordless auth** — Email magic links via NextAuth.js. No passwords stored.
- **Database sessions** — Sessions are stored server-side, not in client-side JWTs, enabling immediate revocation.
- **Access control** — Every API request verifies both session authentication and account-level authorization. Unauthorized requests return 404 to prevent account enumeration.
- **Read-only data access** — Agent Analytics only reads analytics data from Cloudflare. It never writes to or modifies your Cloudflare account.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router)
- **Database:** PostgreSQL via [Drizzle ORM](https://orm.drizzle.team) + [Neon](https://neon.tech)
- **Auth:** [NextAuth.js](https://authjs.dev) with email magic links
- **Styling:** [Tailwind CSS](https://tailwindcss.com) v4
- **Charts:** [Recharts](https://recharts.org)
- **Icons:** [Lucide React](https://lucide.dev)
- **Email:** [Resend](https://resend.com)
- **Hosting:** [Vercel](https://vercel.com)

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Push schema changes to database
npx drizzle-kit push

# Generate migrations
npx drizzle-kit generate
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [Unusual](https://unusual.ai)
