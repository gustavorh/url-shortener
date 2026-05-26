import { test, expect } from "@playwright/test";
import { newUser, registerViaUI } from "./helpers/users";

test.describe("API key issuance and usage", () => {
  test("usuario crea una API key y la usa para acortar vía /api/v1/links", async ({
    page,
    request,
    baseURL,
  }) => {
    const user = newUser("apikey");
    await registerViaUI(page, user);

    await page.goto("/dashboard/keys");
    await expect(
      page.getByRole("heading", { name: "Claves de API" })
    ).toBeVisible();

    await page.getByLabel("Nombre de la clave").fill("e2e-suite");
    await page.getByRole("button", { name: "Crear clave" }).click();

    // The created key is rendered inside a <code> block inside the
    // amber "copy now" banner.
    const banner = page.locator("text=Copia tu clave ahora").locator("..");
    const codeBlock = banner.locator("code").first();
    await expect(codeBlock).toBeVisible({ timeout: 10_000 });
    const apiKey = (await codeBlock.textContent())?.trim();
    expect(apiKey, "the page must render the new API key").toBeTruthy();
    expect(apiKey!.length).toBeGreaterThan(20);

    // Use the key against the public API in an anonymous request context
    // (no cookies) to prove Bearer auth works.
    const target = "https://example.net/api-key-flow?ts=" + Date.now();
    const apiResponse = await request.post(`${baseURL}/api/v1/links`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      data: { originalUrl: target },
    });
    expect(apiResponse.status(), await apiResponse.text()).toBe(201);
    const body = (await apiResponse.json()) as {
      shortUrl?: string;
      id?: string;
    };
    expect(body.shortUrl).toMatch(/^https?:\/\//);
    expect(body.id).toBeTruthy();

    // And the resulting short URL must redirect back to the original.
    const redirect = await request.get(body.shortUrl!, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect([301, 302, 307, 308]).toContain(redirect.status());
    expect(redirect.headers().location).toBe(target);
  });

  test("la API rechaza requests sin Authorization", async ({
    request,
    baseURL,
  }) => {
    const res = await request.post(`${baseURL}/api/v1/links`, {
      data: { originalUrl: "https://example.com" },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});
