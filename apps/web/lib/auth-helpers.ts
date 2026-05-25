import { auth } from "@/auth";

// Returns the authenticated user's id, or null when there is no session.
// Use in route handlers and server components to scope data to a user.
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
