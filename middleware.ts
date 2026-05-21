import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Auth.js middleware: enforces authentication on the routes in `matcher`
// using the edge-safe config. Unauthenticated requests are redirected to
// the sign-in page by the `authorized` callback.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*", "/stats/:path*"],
};
