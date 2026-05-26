import { test, expect } from "@playwright/test";

test.describe("anonymous shorten + redirect", () => {
  test("acorta una URL desde la home y la redirección devuelve a la original", async ({
    page,
    request,
    baseURL,
  }) => {
    test.skip(!baseURL, "baseURL not configured");

    const target =
      "https://example.com/playwright?ts=" + Date.now().toString(36);

    await page.goto("/");
    await page.getByLabel("Enlace que quieres acortar").fill(target);
    await page.getByRole("button", { name: /acortar url/i }).click();

    // Wait for the result block — the success URL appears as a link
    // inside an emerald success card.
    const successLink = page.locator("a", { hasText: /\/[A-Za-z0-9_-]+$/ });
    await expect(successLink.first()).toBeVisible({ timeout: 10_000 });

    const shortUrl = await successLink.first().getAttribute("href");
    expect(shortUrl, "the rendered short URL must have an href").toBeTruthy();

    // Fetch the short URL without following redirects so we can assert
    // the 3xx Location header points back at the original URL.
    const response = await request.get(shortUrl!, {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect([301, 302, 307, 308]).toContain(response.status());
    expect(response.headers().location).toBe(target);
  });
});
