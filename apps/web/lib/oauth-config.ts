// Lightweight server-only helper that reports which OAuth providers are
// configured. Used by /login and /register to decide which buttons to
// render — keeps that check in one place so the UI never tries to
// invoke an unwired provider.

export interface EnabledOAuthProviders {
  github: boolean;
  google: boolean;
}

export function enabledOAuthProviders(): EnabledOAuthProviders {
  return {
    github: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ),
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  };
}

export function hasAnyOAuth(): boolean {
  const p = enabledOAuthProviders();
  return p.github || p.google;
}
