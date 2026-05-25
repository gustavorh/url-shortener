import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "../lib/client";

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

describe("api.verify", () => {
  it("manda Authorization: Bearer y devuelve la cuenta", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        id: "u",
        email: "user@example.com",
        name: null,
        username: "u",
        createdAt: new Date().toISOString(),
        links: 0,
        clicks: 0,
      })
    );

    const me = await api.verify(cfg);
    expect(me.email).toBe("user@example.com");

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("http://localhost:3000/api/v1/me");
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer crtl_test_key",
    });
  });

  it("lanza ApiError 401 cuando la API key es inválida", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "API key inválida" }, 401)
    );
    await expect(api.verify(cfg)).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "API key inválida",
    });
  });
});

describe("api.shorten", () => {
  it("envía body validado y devuelve la URL corta", async () => {
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
    const created = await api.shorten(cfg, {
      url: "https://example.com",
      customAlias: null,
      expirationDate: null,
      password: null,
      maxClicks: null,
      activeFrom: null,
    });
    expect(created.id).toBe("abc");
    expect(created.shortUrl).toBe("http://localhost:3000/abc");

    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).method).toBe("POST");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      url: "https://example.com",
    });
  });

  it("rechaza una URL inválida client-side, sin tocar la red", async () => {
    await expect(
      api.shorten(cfg, {
        url: "no-es-url",
        customAlias: null,
        expirationDate: null,
        password: null,
        maxClicks: null,
        activeFrom: null,
      })
    ).rejects.toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("propaga el error del servidor cuando responde 4xx con JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ error: "Alias ya en uso" }, 409)
    );
    await expect(
      api.shorten(cfg, {
        url: "https://example.com",
        customAlias: "promo",
        expirationDate: null,
        password: null,
        maxClicks: null,
        activeFrom: null,
      })
    ).rejects.toMatchObject({ status: 409, message: "Alias ya en uso" });
  });
});
