interface VerifyResult {
  valid: boolean;
  error?: string;
}

/** Verify a Cloudflare API token is active */
export async function verifyToken(token: string): Promise<VerifyResult> {
  try {
    const res = await fetch(
      "https://api.cloudflare.com/client/v4/user/tokens/verify",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    if (data.success && data.result?.status === "active") {
      return { valid: true };
    }
    const msg =
      data.errors?.[0]?.message || data.result?.status || "Token is not active";
    return { valid: false, error: msg };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to verify token",
    };
  }
}

/** Test that the token can actually read analytics for a specific zone */
export async function testZoneAccess(
  token: string,
  zoneId: string
): Promise<VerifyResult> {
  try {
    const query = `{
      viewer {
        zones(filter: { zoneTag: "${zoneId}" }) {
          httpRequestsAdaptiveGroups(
            filter: { datetime_gt: "${new Date(Date.now() - 86400000).toISOString()}" }
            limit: 1
          ) {
            count
          }
        }
      }
    }`;
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    if (data.errors?.length) {
      return { valid: false, error: data.errors[0].message };
    }
    if (data.data?.viewer?.zones?.length === 0) {
      return { valid: false, error: "Zone not found or token lacks access" };
    }
    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to query zone",
    };
  }
}
