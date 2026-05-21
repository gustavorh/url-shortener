import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config. Contains NO database or Node-only code so it can
// be imported by `middleware.ts` (Edge runtime). The Credentials provider —
// which needs Sequelize + bcrypt — is added in `auth.ts` for the Node runtime.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    // `middleware.ts` only matches protected routes, so any matched request
    // requires an authenticated user.
    authorized({ auth }) {
      return !!auth?.user;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
