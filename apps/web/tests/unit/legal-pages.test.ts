import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const REPO = path.resolve(__dirname, "..", "..");
const PRIVACY = fs.readFileSync(
  path.join(REPO, "app/legal/privacy/page.tsx"),
  "utf8"
);
const TERMS = fs.readFileSync(
  path.join(REPO, "app/legal/terms/page.tsx"),
  "utf8"
);
const FOOTER = fs.readFileSync(
  path.join(REPO, "app/components/Footer.tsx"),
  "utf8"
);
// OAuth (Fase D3) refactored the register page into a client `RegisterForm`
// component, so the legal acceptance copy lives there alongside the form.
const REGISTER = fs.readFileSync(
  path.join(REPO, "app/register/RegisterForm.tsx"),
  "utf8"
);

describe("privacy page", () => {
  it("declares metadata title", () => {
    expect(PRIVACY).toMatch(/Política de privacidad/);
    expect(PRIVACY).toMatch(/export const metadata/);
  });

  it("explains IP anonymization with the exact rule the code applies", () => {
    expect(PRIVACY).toMatch(/último\s+octeto/);
    expect(PRIVACY).toMatch(/203\.0\.113\.42 → 203\.0\.113\.0/);
    expect(PRIVACY).toMatch(/48 bits/);
  });

  it("lists every personal data category we actually persist", () => {
    for (const field of ["correo", "bcrypt", "GitHub", "Google", "URL"]) {
      expect(PRIVACY).toContain(field);
    }
  });

  it("names the third parties (and only those) that receive data", () => {
    expect(PRIVACY).toMatch(/Webhooks/);
    expect(PRIVACY).toMatch(/OAuth/);
    expect(PRIVACY).toMatch(/HMAC/);
  });

  it("points to the profile page for account deletion", () => {
    expect(PRIVACY).toMatch(/\/dashboard\/profile/);
    expect(PRIVACY).toMatch(/irreversible/);
  });

  it("provides a contact email", () => {
    expect(PRIVACY).toMatch(/mailto:hola@linkly\.app/);
  });
});

describe("terms page", () => {
  it("declares metadata title", () => {
    expect(TERMS).toMatch(/Términos de uso/);
    expect(TERMS).toMatch(/export const metadata/);
  });

  it("forbids the categories of misuse the team cares about", () => {
    for (const cat of ["Malware", "Phishing", "Spam", "menores"]) {
      expect(TERMS).toContain(cat);
    }
  });

  it("explains link deactivation and how to appeal", () => {
    expect(TERMS).toMatch(/desactivamos/);
    expect(TERMS).toMatch(/mailto:hola@linkly\.app/);
  });

  it("links to the privacy policy", () => {
    expect(TERMS).toMatch(/\/legal\/privacy/);
  });

  it("commits to a 30-day notice before closing the service", () => {
    expect(TERMS).toMatch(/30 días/);
  });
});

describe("footer component", () => {
  it("links to both legal pages", () => {
    expect(FOOTER).toMatch(/href="\/legal\/privacy"/);
    expect(FOOTER).toMatch(/href="\/legal\/terms"/);
  });

  it("uses a semantic <footer> with a labelled nav", () => {
    expect(FOOTER).toMatch(/<footer/);
    expect(FOOTER).toMatch(/aria-label="Legal"/);
  });
});

describe("register page", () => {
  it("requires legal acceptance with both links", () => {
    expect(REGISTER).toMatch(/href="\/legal\/terms"/);
    expect(REGISTER).toMatch(/href="\/legal\/privacy"/);
    expect(REGISTER).toMatch(/aceptas los/);
  });
});
