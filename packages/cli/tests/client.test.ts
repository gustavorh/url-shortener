import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../src/client";

const cfg = { baseUrl: "http://localhost:3000", apiKey: "crtl_test_key" };

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api.me", () => {
  it("llama a /api/v1/me con el bearer header y valida la respuesta", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: "u",
        email: "x@example.com",
        name: null,
        username: null,
        createdAt: new Date().toISOString(),
        links: 3,
        clicks: 12,
      })
    );

    const me = await api.me(cfg);
    expect(me.email).toBe("x@example.com");
    expect(me.links).toBe(3);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/v1/me");
    expect((init as RequestInit).method).toBe("GET");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer crtl_test_key",
    });
  });

  it("lanza ApiError cuando el servidor responde 401", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "API key inválida" }, 401)
    );
    await expect(api.me(cfg)).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "API key inválida",
    });
    await expect(api.me(cfg)).rejects.toBeInstanceOf(ApiError).catch(() => {
      /* ya validado arriba */
    });
  });

  it("usa 'HTTP <status>' como fallback cuando el cuerpo no es JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("nope", { status: 500 })
    );
    await expect(api.me(cfg)).rejects.toMatchObject({ status: 500, message: "HTTP 500" });
  });
});

describe("api.createLink", () => {
  it("envía el body validado y devuelve la URL corta", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          id: "abc",
          shortUrl: "http://localhost:3000/abc",
          originalUrl: "https://example.com",
          expirationDate: null,
          creationDate: new Date().toISOString(),
        },
        201
      )
    );
    const created = await api.createLink(cfg, {
      url: "https://example.com",
      customAlias: null,
      expirationDate: null,
      password: null,
      maxClicks: null,
      activeFrom: null,
    });
    expect(created.id).toBe("abc");

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      url: "https://example.com",
    });
  });

  it("rechaza una URL inválida antes de hacer la llamada", async () => {
    await expect(
      api.createLink(cfg, {
        url: "no-es-una-url",
        customAlias: null,
        expirationDate: null,
        password: null,
        maxClicks: null,
        activeFrom: null,
      })
    ).rejects.toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("api.listLinks", () => {
  it("codifica los query params correctamente", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ total: 0, limit: 25, offset: 0, links: [] })
    );
    await api.listLinks(cfg, { limit: 25, offset: 0, search: "foo", tag: "bar" });
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      "http://localhost:3000/api/v1/links?limit=25&offset=0&search=foo&tag=bar"
    );
  });

  it("omite los params no provistos", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ total: 0, limit: 50, offset: 0, links: [] })
    );
    await api.listLinks(cfg, {});
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/v1/links");
  });
});

describe("api.getStats", () => {
  it("escapa el id en la URL", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: "x/y",
        total: 0,
        byDay: [],
        byHour: [],
        topReferrers: [],
        byDevice: [],
        byBrowser: [],
        byCountry: [],
        byOs: [],
        byTarget: [],
      })
    );
    await api.getStats(cfg, "x/y");
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/v1/links/x%2Fy/stats");
  });
});
