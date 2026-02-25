import Link from "next/link";
import { Bot, FileText, BarChart3, ArrowRight, Eye } from "lucide-react";

const ORGS = [
  "OpenAI",
  "Anthropic",
  "Google",
  "Perplexity",
  "DeepSeek",
  "Meta",
  "Mistral",
  "Apple",
];

const FEATURES = [
  {
    icon: Eye,
    title: "Real-time monitoring",
    description:
      "See exactly which AI agents are crawling your website, how often, and how much data they consume.",
  },
  {
    icon: FileText,
    title: "Page-level insights",
    description:
      "Drill down into individual pages to see which agents visit them most and track trends over time.",
  },
  {
    icon: BarChart3,
    title: "Agent breakdown",
    description:
      "View traffic by individual agent and organization — from OpenAI's GPTBot to Anthropic's ClaudeBot.",
  },
];

const MOCK_AGENTS = [
  { name: "GPTBot", requests: 2847, pct: 100, color: "#10b981" },
  { name: "ClaudeBot", requests: 2134, pct: 75, color: "#f59e0b" },
  { name: "PerplexityBot", requests: 1562, pct: 55, color: "#8b5cf6" },
  { name: "Google-Extended", requests: 1203, pct: 42, color: "#3b82f6" },
  { name: "ChatGPT-User", requests: 891, pct: 31, color: "#34d399" },
  { name: "Applebot", requests: 634, pct: 22, color: "#6b7280" },
  { name: "DeepSeekBot", requests: 412, pct: 14, color: "#06b6d4" },
];

// Data points for mock area chart (cumulative stacked values for SVG paths)
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MOCK_SERIES = {
  // Each array is cumulative y-values (0 = top of chart area, 180 = bottom)
  // Layer order bottom-to-top: Google, Perplexity, Anthropic, OpenAI
  google:     [180, 160, 210, 190, 170, 120, 150],
  perplexity: [230, 200, 260, 240, 280, 180, 200],
  claude:     [310, 340, 290, 360, 320, 210, 250],
  gpt:        [420, 380, 510, 470, 390, 290, 340],
};

function buildAreaPath(values: number[], maxY: number, w: number, h: number): string {
  const n = values.length;
  const stepX = w / (n - 1);
  const points = values.map((v, i) => `${i * stepX},${h - (v / maxY) * h}`);
  return `M0,${h} L${points.join(" L")} L${w},${h} Z`;
}

function buildStackedPaths(w: number, h: number) {
  const maxY = 1300;
  // Cumulative from bottom: google → +perplexity → +claude → +gpt
  const googleCum = MOCK_SERIES.google;
  const perplCum = googleCum.map((v, i) => v + MOCK_SERIES.perplexity[i]);
  const claudeCum = perplCum.map((v, i) => v + MOCK_SERIES.claude[i]);
  const gptCum = claudeCum.map((v, i) => v + MOCK_SERIES.gpt[i]);

  return [
    { values: gptCum, color: "#10b981", opacity: 0.6 },
    { values: claudeCum, color: "#f59e0b", opacity: 0.6 },
    { values: perplCum, color: "#8b5cf6", opacity: 0.6 },
    { values: googleCum, color: "#3b82f6", opacity: 0.6 },
  ].map((layer) => ({
    d: buildAreaPath(layer.values, maxY, w, h),
    color: layer.color,
    opacity: layer.opacity,
  }));
}

const MOCK_PAGES = [
  { path: "/", requests: 3241, agents: 8 },
  { path: "/pricing", requests: 1872, agents: 6 },
  { path: "/docs/getting-started", requests: 1456, agents: 5 },
  { path: "/blog/ai-trends-2025", requests: 1122, agents: 7 },
  { path: "/about", requests: 894, agents: 4 },
];

export default function HomePage() {
  return (
    <div className="bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-600" />
            <span className="font-semibold">Agent Analytics</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-gray-500 transition-colors hover:text-gray-900"
          >
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex min-h-screen flex-col items-center justify-center px-6 pt-14 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-emerald-600">
          Open source &amp; free
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight text-gray-900 md:text-6xl">
          See which AI agents are reading your website
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
          Agent Analytics monitors when AI crawlers like ChatGPT, Claude, and
          Perplexity visit your pages — so you can understand how AI is consuming
          your content.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-gray-800"
        >
          Start tracking for free
          <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          No credit card required · Built by{" "}
          <a
            href="https://unusual.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 underline hover:text-gray-900"
          >
            Unusual
          </a>
        </p>
      </section>

      {/* Agents tracked */}
      <section className="border-t border-gray-200 py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-10 text-sm font-medium uppercase tracking-widest text-gray-400">
            Tracking 14 AI agents across 8 organizations
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ORGS.map((org) => (
              <div
                key={org}
                className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700"
              >
                {org}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-200 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Everything you need to understand AI traffic
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-center text-gray-500">
            A simple, focused dashboard that shows you exactly what matters.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <f.icon className="mb-4 h-8 w-8 text-emerald-600" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard mock */}
      <section className="border-t border-gray-200 bg-gray-50 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-4 text-center text-3xl font-bold text-gray-900">
            Your dashboard at a glance
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-gray-500">
            See traffic trends, top pages, and agent breakdown — all in one
            place.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stacked area chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Agent Traffic Over Time
                </p>
                <span className="rounded-full border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-400">
                  Last 7 days
                </span>
              </div>
              <div className="relative">
                <svg
                  viewBox="0 0 400 180"
                  className="w-full"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75].map((f) => (
                    <line
                      key={f}
                      x1={0}
                      y1={180 * (1 - f)}
                      x2={400}
                      y2={180 * (1 - f)}
                      stroke="#e5e7eb"
                      strokeDasharray="4 4"
                    />
                  ))}
                  {/* Stacked areas — rendered top-to-bottom so bottom layers paint over */}
                  {buildStackedPaths(400, 180).map((layer, i) => (
                    <path
                      key={i}
                      d={layer.d}
                      fill={layer.color}
                      opacity={layer.opacity}
                    />
                  ))}
                </svg>
                {/* X-axis labels */}
                <div className="mt-1.5 flex justify-between px-0.5">
                  {DAYS.map((d) => (
                    <span key={d} className="text-[10px] text-gray-400">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  OpenAI
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                  Anthropic
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />
                  Perplexity
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                  Google
                </span>
              </div>
            </div>

            {/* Agent bar chart */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Requests by Agent
                </p>
                <p className="text-2xl font-bold text-gray-900">9,683</p>
              </div>
              <div className="space-y-2.5">
                {MOCK_AGENTS.map((agent) => (
                  <div key={agent.name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-right text-xs text-gray-500">
                      {agent.name}
                    </span>
                    <div className="flex-1">
                      <div
                        className="h-5 rounded"
                        style={{
                          width: `${agent.pct}%`,
                          backgroundColor: agent.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs text-gray-400">
                      {agent.requests.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top pages table */}
            <div className="rounded-xl border border-gray-200 bg-white lg:col-span-2">
              <div className="border-b border-gray-200 px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Top Crawled Pages
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-2.5">Path</th>
                    <th className="px-5 py-2.5 text-right">Requests</th>
                    <th className="px-5 py-2.5 text-right">Agents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {MOCK_PAGES.map((page) => (
                    <tr key={page.path}>
                      <td className="px-5 py-2.5 font-mono text-sm text-gray-700">
                        {page.path === "/" ? "Homepage (/)" : page.path}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-sm font-medium text-gray-900">
                        {page.requests.toLocaleString()}
                      </td>
                      <td className="px-5 py-2.5 text-right text-sm text-gray-500">
                        {page.agents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="border-t border-gray-200 py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Why Agent Analytics?
          </h2>
          <p className="text-lg leading-relaxed text-gray-500">
            AI agents are the new visitors to your website. ChatGPT, Claude,
            Perplexity, and others are reading your content to answer questions,
            train models, and power search results. You deserve to know who's
            reading — and what they're reading. Agent Analytics makes this
            visible, for free.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-200 py-24">
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-3.5 font-semibold text-white transition-colors hover:bg-gray-800"
          >
            Start tracking for free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-6 text-sm text-gray-400">
            Built by{" "}
            <a
              href="https://unusual.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 underline transition-colors hover:text-gray-900"
            >
              Unusual
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
