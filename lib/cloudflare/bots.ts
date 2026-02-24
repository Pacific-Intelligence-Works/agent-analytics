export interface AgentInfo {
  ua: string;
  org: string;
  category: "ai_crawler" | "ai_search" | "ai_assistant";
  description: string;
}

/** All known AI agents — ua is the substring to match in raw user-agent strings */
export const AI_AGENTS: AgentInfo[] = [
  // OpenAI
  {
    ua: "GPTBot",
    org: "OpenAI",
    category: "ai_crawler",
    description:
      "OpenAI's crawler that indexes content for ChatGPT's training data and knowledge base.",
  },
  {
    ua: "ChatGPT-User",
    org: "OpenAI",
    category: "ai_assistant",
    description:
      "Agent spawned by ChatGPT to browse the web during a live conversation when a user asks it to look something up.",
  },
  {
    ua: "OAI-SearchBot",
    org: "OpenAI",
    category: "ai_search",
    description:
      "OpenAI's search agent that fetches and indexes web results for ChatGPT's built-in search feature.",
  },
  // Anthropic
  {
    ua: "ClaudeBot",
    org: "Anthropic",
    category: "ai_crawler",
    description:
      "Anthropic's crawler that indexes web content for Claude's training data and knowledge base.",
  },
  {
    ua: "Claude-SearchBot",
    org: "Anthropic",
    category: "ai_search",
    description:
      "Anthropic's search agent that fetches web results when Claude uses its web search tool.",
  },
  {
    ua: "Claude-User",
    org: "Anthropic",
    category: "ai_assistant",
    description:
      "Agent spawned by Claude to fetch a specific URL during a live conversation when a user shares a link.",
  },
  // Google
  {
    ua: "Google-Extended",
    org: "Google",
    category: "ai_crawler",
    description:
      "Google's crawler that collects content for Gemini AI training. Separate from Googlebot (which is for Search indexing).",
  },
  {
    ua: "Google-CloudVertexBot",
    org: "Google",
    category: "ai_crawler",
    description:
      "Google Cloud's AI crawler used by Vertex AI and other Google Cloud AI services to fetch grounding data.",
  },
  // Perplexity
  {
    ua: "PerplexityBot",
    org: "Perplexity",
    category: "ai_search",
    description:
      "Perplexity's crawler that indexes web content to power its AI-powered search engine.",
  },
  {
    ua: "Perplexity-User",
    org: "Perplexity",
    category: "ai_assistant",
    description:
      "Agent spawned by Perplexity during a live search session to fetch and read specific pages for answers.",
  },
  // DeepSeek
  {
    ua: "DeepSeekBot",
    org: "DeepSeek",
    category: "ai_crawler",
    description:
      "DeepSeek's crawler that indexes web content for training and grounding their AI models.",
  },
  // Meta
  {
    ua: "Meta-ExternalAgent",
    org: "Meta",
    category: "ai_crawler",
    description:
      "Meta's AI crawler that fetches web content for Meta AI features across Facebook, Instagram, and WhatsApp.",
  },
  // Mistral
  {
    ua: "MistralAI-User",
    org: "Mistral",
    category: "ai_assistant",
    description:
      "Mistral's agent that fetches web content during live conversations in Le Chat or Mistral API calls.",
  },
  // Apple
  {
    ua: "Applebot",
    org: "Apple",
    category: "ai_search",
    description:
      "Apple's crawler used by Siri, Spotlight, and Apple Intelligence to index and summarize web content.",
  },
];

/** Org → color mapping for charts */
export const ORG_COLORS: Record<string, string> = {
  OpenAI: "#10b981",
  Anthropic: "#f59e0b",
  Google: "#3b82f6",
  Perplexity: "#8b5cf6",
  DeepSeek: "#06b6d4",
  Meta: "#6366f1",
  Mistral: "#ec4899",
  Apple: "#6b7280",
};

/** Agent name → color mapping for per-agent charts */
export const AGENT_COLORS: Record<string, string> = {
  GPTBot: "#10b981",
  "ChatGPT-User": "#34d399",
  "OAI-SearchBot": "#6ee7b7",
  ClaudeBot: "#f59e0b",
  "Claude-SearchBot": "#fbbf24",
  "Claude-User": "#fcd34d",
  "Google-Extended": "#3b82f6",
  "Google-CloudVertexBot": "#60a5fa",
  PerplexityBot: "#8b5cf6",
  "Perplexity-User": "#a78bfa",
  DeepSeekBot: "#06b6d4",
  "Meta-ExternalAgent": "#6366f1",
  "MistralAI-User": "#ec4899",
  Applebot: "#6b7280",
};

/** Match a raw user-agent string to a known agent */
export function classifyUserAgent(
  userAgent: string
): { botName: string; org: string; category: string } | null {
  for (const agent of AI_AGENTS) {
    if (userAgent.includes(agent.ua)) {
      return { botName: agent.ua, org: agent.org, category: agent.category };
    }
  }
  return null;
}

/** Get userAgent_like filter values for the CF GraphQL OR filter */
export function getBotFilterList(): string[] {
  return AI_AGENTS.map((agent) => `%${agent.ua}%`);
}
