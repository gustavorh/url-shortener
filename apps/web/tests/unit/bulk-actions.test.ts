import { describe, expect, it } from "vitest";
import { IdsBodySchema, MAX_BULK_IDS } from "@/lib/bulk-schemas";

describe("IdsBodySchema", () => {
  it("acepta una lista no vacía dentro del cap", () => {
    expect(
      IdsBodySchema.parse({ ids: ["abc", "def"] })
    ).toEqual({ ids: ["abc", "def"] });
  });

  it("rechaza la lista vacía", () => {
    expect(IdsBodySchema.safeParse({ ids: [] }).success).toBe(false);
  });

  it("rechaza el body sin la clave ids", () => {
    expect(IdsBodySchema.safeParse({}).success).toBe(false);
  });

  it("rechaza un id vacío o demasiado largo", () => {
    expect(IdsBodySchema.safeParse({ ids: [""] }).success).toBe(false);
    expect(
      IdsBodySchema.safeParse({ ids: ["x".repeat(65)] }).success
    ).toBe(false);
  });

  it(`rechaza más de ${MAX_BULK_IDS} ids`, () => {
    const tooMany = Array.from({ length: MAX_BULK_IDS + 1 }, (_, i) =>
      `id-${i}`
    );
    expect(IdsBodySchema.safeParse({ ids: tooMany }).success).toBe(false);
  });
});
