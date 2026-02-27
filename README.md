# Agent Analytics

**See which AI agents are reading your website.**

Agent Analytics monitors when AI crawlers like ChatGPT, Claude, Perplexity, and Gemini visit your pages — so you can understand how AI is consuming your content.

**[Start tracking for free at agentanalytics.unusual.ai](https://agentanalytics.unusual.ai)**

## How it works

1. Sign up and enter your domain
2. Connect your Cloudflare account (read-only analytics API token)
3. Agent Analytics syncs your AI crawler data every 6 hours
4. View traffic trends, top pages, and agent breakdowns in a simple dashboard

Your Cloudflare API token is encrypted with AES-256-GCM and only decrypted server-side when syncing data. The full encryption implementation is in [`lib/encryption.ts`](lib/encryption.ts).

## Tracked agents

Agent Analytics identifies **14 AI agents** across **8 organizations**:

| Organization | Agents |
|---|---|
| OpenAI | GPTBot, ChatGPT-User, OAI-SearchBot |
| Anthropic | ClaudeBot, Claude-SearchBot |
| Google | Google-Extended, GoogleOther |
| Perplexity | PerplexityBot |
| DeepSeek | Deepseekbot |
| Meta | FacebookBot, meta-externalagent |
| Mistral | MistralBot |
| Apple | Applebot-Extended |

## Tech stack

- **Framework:** Next.js (App Router)
- **Database:** Postgres via Drizzle ORM
- **Auth:** NextAuth.js with email magic links
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **Email:** Resend

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [Unusual](https://unusual.ai)
