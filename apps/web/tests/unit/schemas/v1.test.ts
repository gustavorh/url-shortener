import { describe, expect, it } from "vitest";
import {
  CreateLinkBodySchema,
  LinkIdParamSchema,
  ListLinksQuerySchema,
  MeResponseSchema,
  LinkStatsResponseSchema,
  ListLinksResponseSchema,
} from "@linkly/schemas/v1";

describe("CreateLinkBodySchema", () => {
  it("acepta el mínimo: solo url", () => {
    const parsed = CreateLinkBodySchema.parse({ url: "https://ejemplo.com" });
    expect(parsed.url).toBe("https://ejemplo.com");
    expect(parsed.customAlias).toBeNull();
    expect(parsed.expirationDate).toBeNull();
    expect(parsed.password).toBeNull();
    expect(parsed.maxClicks).toBeNull();
    expect(parsed.activeFrom).toBeNull();
  });

  it("rechaza url ausente o vacía", () => {
    expect(CreateLinkBodySchema.safeParse({}).success).toBe(false);
    expect(CreateLinkBodySchema.safeParse({ url: "" }).success).toBe(false);
  });

  it("rechaza url malformada", () => {
    expect(
      CreateLinkBodySchema.safeParse({ url: "no-es-una-url" }).success
    ).toBe(false);
  });

  it("convierte expirationDate string en Date", () => {
    const iso = "2030-01-01T00:00:00.000Z";
    const parsed = CreateLinkBodySchema.parse({
      url: "https://ejemplo.com",
      expirationDate: iso,
    });
    expect(parsed.expirationDate).toBeInstanceOf(Date);
    expect(parsed.expirationDate?.toISOString()).toBe(iso);
  });

  it("rechaza expirationDate no-parseable", () => {
    expect(
      CreateLinkBodySchema.safeParse({
        url: "https://ejemplo.com",
        expirationDate: "no-fecha",
      }).success
    ).toBe(false);
  });

  it("rechaza maxClicks negativo o decimal", () => {
    expect(
      CreateLinkBodySchema.safeParse({
        url: "https://ejemplo.com",
        maxClicks: -1,
      }).success
    ).toBe(false);
    expect(
      CreateLinkBodySchema.safeParse({
        url: "https://ejemplo.com",
        maxClicks: 1.5,
      }).success
    ).toBe(false);
  });

  it("normaliza customAlias null/undefined a null", () => {
    expect(
      CreateLinkBodySchema.parse({
        url: "https://ejemplo.com",
        customAlias: null,
      }).customAlias
    ).toBeNull();
    expect(
      CreateLinkBodySchema.parse({
        url: "https://ejemplo.com",
      }).customAlias
    ).toBeNull();
  });

  it("rechaza customAlias demasiado largo", () => {
    expect(
      CreateLinkBodySchema.safeParse({
        url: "https://ejemplo.com",
        customAlias: "x".repeat(65),
      }).success
    ).toBe(false);
  });
});

describe("ListLinksQuerySchema", () => {
  it("aplica defaults cuando no llegan params", () => {
    const parsed = ListLinksQuerySchema.parse({});
    expect(parsed.limit).toBe(50);
    expect(parsed.offset).toBe(0);
    expect(parsed.search).toBeUndefined();
    expect(parsed.tag).toBeUndefined();
  });

  it("coerciona limit y offset desde string", () => {
    const parsed = ListLinksQuerySchema.parse({
      limit: "10",
      offset: "20",
    });
    expect(parsed.limit).toBe(10);
    expect(parsed.offset).toBe(20);
  });

  it("acota limit al rango [1, 100]", () => {
    expect(ListLinksQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(ListLinksQuerySchema.safeParse({ limit: "101" }).success).toBe(
      false
    );
  });

  it("rechaza offset negativo", () => {
    expect(ListLinksQuerySchema.safeParse({ offset: "-1" }).success).toBe(
      false
    );
  });

  it("recorta search y lowercasea tag", () => {
    const parsed = ListLinksQuerySchema.parse({
      search: "  Marketing ",
      tag: "  Promo  ",
    });
    expect(parsed.search).toBe("Marketing");
    expect(parsed.tag).toBe("promo");
  });

  it("trata search/tag vacíos como ausentes", () => {
    const parsed = ListLinksQuerySchema.parse({ search: "   ", tag: " " });
    expect(parsed.search).toBeUndefined();
    expect(parsed.tag).toBeUndefined();
  });
});

describe("LinkIdParamSchema", () => {
  it("acepta ids cortos", () => {
    expect(LinkIdParamSchema.parse("abc123")).toBe("abc123");
  });

  it("rechaza id vacío", () => {
    expect(LinkIdParamSchema.safeParse("").success).toBe(false);
  });

  it("rechaza id demasiado largo", () => {
    expect(LinkIdParamSchema.safeParse("x".repeat(65)).success).toBe(false);
  });
});

describe("Response schemas son self-consistent", () => {
  it("ListLinksResponseSchema acepta una respuesta válida", () => {
    const sample = {
      total: 1,
      limit: 50,
      offset: 0,
      links: [
        {
          id: "abc",
          shortUrl: "http://localhost/abc",
          originalUrl: "https://ejemplo.com",
          title: null,
          tags: ["marketing"],
          clicks: 3,
          disabled: false,
          expirationDate: null,
          creationDate: "2026-05-24T00:00:00.000Z",
        },
      ],
    };
    expect(ListLinksResponseSchema.safeParse(sample).success).toBe(true);
  });

  it("MeResponseSchema acepta valores típicos", () => {
    const sample = {
      id: "user-1",
      email: "user@example.com",
      name: null,
      username: null,
      createdAt: new Date(),
      links: 0,
      clicks: 0,
    };
    expect(MeResponseSchema.safeParse(sample).success).toBe(true);
  });

  it("LinkStatsResponseSchema acepta el bundle completo", () => {
    const sample = {
      id: "abc",
      total: 0,
      byDay: [],
      byHour: [],
      topReferrers: [],
      byDevice: [],
      byBrowser: [],
      byCountry: [],
      byOs: [],
      byTarget: [],
    };
    expect(LinkStatsResponseSchema.safeParse(sample).success).toBe(true);
  });
});
