import { randomUUID } from "node:crypto";
import { User } from "@/models";
import type { AuthProvider } from "@/models/user";

// Resolves an OAuth profile to a Linkly user. Used by auth.ts on every
// successful GitHub / Google sign-in.
//
// Linking strategy — three cases:
//   1. (provider, providerId) already exists → return that user, refresh
//      name/image if we didn't have them yet.
//   2. Email exists in DB → link OAuth onto that account (the Credentials
//      user can now sign in via either path).
//   3. Otherwise → create a new account with no passwordHash.
//
// We trust the OAuth provider's email verification. Google guarantees
// it; GitHub returns the user's primary email which is verified when
// users connect a new email. If you ever wire up a provider with weaker
// guarantees (e.g. allowing unverified emails), do NOT route through
// `linkExistingByEmail` — that would let an attacker hijack a known
// Linkly account by registering its email externally.

export interface OAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name: string | null;
  image: string | null;
}

export interface SyncResult {
  id: string;
  email: string;
  // True the first time we see this OAuth identity (either created or
  // linked onto an existing email). Useful for analytics / audit logs.
  isNew: boolean;
}

export async function syncOAuthUser(profile: OAuthProfile): Promise<SyncResult> {
  // 1) Already linked.
  const byProvider = await User.findOne({
    where: { provider: profile.provider, providerId: profile.providerId },
  });
  if (byProvider) {
    const updates: Record<string, unknown> = {};
    if (!byProvider.name && profile.name) updates.name = profile.name;
    if (!byProvider.image && profile.image) updates.image = profile.image;
    if (Object.keys(updates).length > 0) await byProvider.update(updates);
    return { id: byProvider.id, email: byProvider.email, isNew: false };
  }

  // 2) Existing local account — link this OAuth identity onto it.
  const byEmail = await User.findOne({ where: { email: profile.email } });
  if (byEmail) {
    // Refuse to link if the row is already bound to a *different* OAuth
    // identity. This prevents a malicious second provider from silently
    // capturing an account that's already wired to GitHub when the
    // attacker controls a Google account with the same email.
    if (
      byEmail.provider &&
      (byEmail.provider !== profile.provider ||
        byEmail.providerId !== profile.providerId)
    ) {
      throw new Error(
        `Esta cuenta ya está vinculada a ${byEmail.provider}. Inicia sesión por esa vía.`
      );
    }
    const updates: Record<string, unknown> = {
      provider: profile.provider,
      providerId: profile.providerId,
    };
    if (!byEmail.name && profile.name) updates.name = profile.name;
    if (!byEmail.image && profile.image) updates.image = profile.image;
    await byEmail.update(updates);
    return { id: byEmail.id, email: byEmail.email, isNew: true };
  }

  // 3) Fresh account.
  const id = randomUUID();
  const created = await User.create({
    id,
    email: profile.email,
    passwordHash: null,
    provider: profile.provider,
    providerId: profile.providerId,
    name: profile.name,
    image: profile.image,
  });
  return { id: created.id, email: created.email, isNew: true };
}
