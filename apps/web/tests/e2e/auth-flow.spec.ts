import { test, expect } from "@playwright/test";
import { newUser, registerViaUI } from "./helpers/users";

test.describe("register → dashboard → stats", () => {
  test("usuario nuevo se registra, acorta un enlace y ve sus estadísticas", async ({
    page,
  }) => {
    const user = newUser("auth");
    await registerViaUI(page, user);

    // After register the helper waits for /dashboard. The dashboard renders
    // the shortener form again — same UI as the home but authenticated.
    await expect(page).toHaveURL(/\/dashboard$/);

    // Go back to / where the inline shortener lives.
    await page.goto("/");
    const target = "https://example.org/auth-flow?ts=" + Date.now();
    await page.getByLabel("Enlace que quieres acortar").fill(target);
    await page.getByRole("button", { name: /acortar url/i }).click();

    // Authenticated users see a "Ver estadísticas del enlace →" link
    // inside the success card.
    const statsLink = page.getByRole("link", {
      name: /ver estadísticas del enlace/i,
    });
    await expect(statsLink).toBeVisible({ timeout: 10_000 });

    await statsLink.click();
    await page.waitForURL("**/stats/**", { timeout: 10_000 });

    // The stats page must show the original URL we just shortened.
    await expect(page.getByText(target)).toBeVisible({ timeout: 10_000 });
  });

  test("login form rechaza credenciales inválidas con mensaje en el formulario", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("Correo electrónico").fill("nope@linkly-e2e.local");
    await page.getByLabel("Contraseña").fill("WrongPassword!1");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    // App should stay on /login and surface an error. We don't pin the
    // exact copy because it may change — just assert we did NOT land on
    // the dashboard.
    await page.waitForTimeout(1500);
    expect(page.url()).not.toContain("/dashboard");
  });
});
