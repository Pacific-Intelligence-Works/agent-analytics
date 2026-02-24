import dns from "dns/promises";

interface DetectResult {
  isCloudflare: boolean;
  method?: "http-header" | "dns-ns";
}

/** Auto-detect if a domain is served through Cloudflare */
export async function detectCloudflare(domain: string): Promise<DetectResult> {
  // Method 1: HTTP headers
  try {
    const res = await fetch(`https://${domain}`, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const server = res.headers.get("server")?.toLowerCase();
    const cfRay = res.headers.get("cf-ray");
    if (server === "cloudflare" || cfRay) {
      return { isCloudflare: true, method: "http-header" };
    }
  } catch {
    // HTTP check failed, fall through to DNS
  }

  // Method 2: DNS nameservers
  try {
    const nsRecords = await dns.resolveNs(domain);
    const hasCfNs = nsRecords.some((ns) =>
      ns.toLowerCase().endsWith(".ns.cloudflare.com")
    );
    if (hasCfNs) {
      return { isCloudflare: true, method: "dns-ns" };
    }
  } catch {
    // DNS check failed
  }

  return { isCloudflare: false };
}
