// Pure Zod schemas for the /api/links/bulk/* endpoints. Lives in its
// own file (separate from lib/bulk-actions.ts) so test runners can
// import the schemas without pulling NextResponse / Sequelize into the
// graph.

import { z } from "zod";

export const MAX_BULK_IDS = 500;

export const IdsBodySchema = z.object({
  ids: z.array(z.string().min(1).max(64)).min(1).max(MAX_BULK_IDS),
});

export type IdsBody = z.infer<typeof IdsBodySchema>;
