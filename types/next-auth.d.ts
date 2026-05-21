import type { DefaultSession } from "next-auth";

// Expose the user id on the session and JWT so server components and
// route handlers can scope queries to the authenticated user.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
