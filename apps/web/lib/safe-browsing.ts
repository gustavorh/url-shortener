// Google Safe Browsing lookup. Opt-in: when SAFE_BROWSING_API_KEY is unset
// the check is skipped. It also fails open — network/API errors never block
// link creation — so a Safe Browsing outage cannot take the product down.

const THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "POTENTIALLY_HARMFUL_APPLICATION",
];

/** Returns true when the URL is flagged as malicious by Safe Browsing. */
export async function isUrlUnsafe(url: string): Promise<boolean> {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "cortala", clientVersion: "1.0" },
          threatInfo: {
            threatTypes: THREAT_TYPES,
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!response.ok) return false;

    const data = (await response.json()) as { matches?: unknown[] };
    return Array.isArray(data.matches) && data.matches.length > 0;
  } catch {
    // Fail open: never block link creation on a Safe Browsing failure.
    return false;
  }
}
