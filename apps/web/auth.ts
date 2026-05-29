import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { User } from "@/models";
import { syncOAuthUser } from "@/lib/oauth-linking";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Build the provider list dynamically — OAuth providers only get added
// when their credentials are present, so the app stays bootable with
// just the Credentials path (useful for self-hosting without registering
// OAuth apps).
function providers(): NextAuthConfig["providers"] {
  const list: NextAuthConfig["providers"] = [
    Credentials({
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        // Registration stores emails lowercased, so look up the same way —
        // otherwise "Admin@x.com" at login never matches "admin@x.com".
        const user = await User.findOne({
          where: { email: email.toLowerCase() },
        });
        // OAuth-only users (passwordHash === null) can never log in via
        // Credentials — that path is reserved for accounts that set a
        // local password.
        if (!user || !user.passwordHash) return null;

        const passwordMatches = await bcrypt.compare(
          password,
          user.passwordHash
        );
        if (!passwordMatches) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ];

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    list.push(
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
      })
    );
  }
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    list.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }
  return list;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: providers(),
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Credentials already validated the user in `authorize` above.
      if (!account || account.provider === "credentials") return true;

      if (account.provider === "github" || account.provider === "google") {
        if (!user.email) {
          // We need an email to look the account up — Google always
          // provides one; GitHub does when the user's primary email is
          // public. If it's missing, abort the sign-in.
          return "/login?error=oauth_email_missing";
        }
        try {
          const synced = await syncOAuthUser({
            provider: account.provider,
            providerId: account.providerAccountId,
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          });
          // Override the auth.js-generated id with our DB id so the JWT
          // callback writes our id into the token (the rest of the app
          // looks up everything by users.id).
          user.id = synced.id;
          return true;
        } catch (err) {
          console.error("[auth] OAuth linking failed:", err);
          return "/login?error=oauth_link_failed";
        }
      }

      return true;
    },
  },
});
