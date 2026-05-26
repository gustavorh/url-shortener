import type { Page } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

let counter = 0;

export function newUser(prefix = "e2e"): TestUser {
  counter += 1;
  const stamp = Date.now().toString(36) + counter.toString(36);
  return {
    email: `${prefix}-${stamp}@cortala-e2e.local`,
    password: "Sup3rSecret-Pass!",
    name: "Cortala Tester",
  };
}

export async function registerViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto("/register");
  await page.getByLabel("Nombre", { exact: false }).fill(user.name);
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}

export async function loginViaUI(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
}
