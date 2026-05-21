export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

const UTM_KEYS: Record<keyof UtmParams, string> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  term: "utm_term",
  content: "utm_content",
};

/**
 * Appends non-empty UTM parameters to a URL. Adds an https:// scheme when
 * missing so the builder works on bare hostnames; invalid input is returned
 * untouched (it is validated downstream).
 */
export function appendUtmParams(rawUrl: string, params: UtmParams): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return rawUrl;

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return rawUrl;
  }

  for (const [key, paramName] of Object.entries(UTM_KEYS)) {
    const value = params[key as keyof UtmParams]?.trim();
    if (value) {
      url.searchParams.set(paramName, value);
    }
  }
  return url.toString();
}

/** True when at least one UTM field has a value. */
export function hasAnyUtm(params: UtmParams): boolean {
  return Object.values(params).some((value) => value?.trim());
}
