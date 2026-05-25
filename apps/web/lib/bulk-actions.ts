// Helpers shared by /api/links/bulk/* endpoints. Each operation owns
// its own route file so the verbs stay readable in the URL, but the
// boilerplate (auth, ownership scoping, Zod validation, count
// returned to the client) is centralised here. The Zod surface lives
// in ./bulk-schemas so unit tests can import it without dragging
// NextResponse / Sequelize through the resolver.

import { Op } from "sequelize";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { NextResponse } from "next/server";
import { IdsBodySchema, MAX_BULK_IDS } from "@/lib/bulk-schemas";

export { IdsBodySchema, MAX_BULK_IDS } from "@/lib/bulk-schemas";
export type { IdsBody } from "@/lib/bulk-schemas";

export async function withBulkAuth(
  body: unknown,
  handler: (input: {
    userId: string;
    ids: string[];
  }) => Promise<Record<string, unknown>>
): Promise<NextResponse> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const parsed = IdsBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ??
          `Envía entre 1 y ${MAX_BULK_IDS} ids`,
      },
      { status: 400 }
    );
  }

  // De-dup before hitting the DB — the user might double-click the
  // same row, or a query string might surface the same id twice.
  const ids = Array.from(new Set(parsed.data.ids));

  const result = await handler({ userId, ids });
  return NextResponse.json(result);
}

// Scopes a Sequelize-level update or destroy to rows the caller owns.
// Returns the `where` clause; callers feed it to Url.update or
// Url.destroy as needed.
export function whereOwnedByUser(userId: string, ids: string[]) {
  return { userId, deletedAt: null, id: { [Op.in]: ids } };
}
