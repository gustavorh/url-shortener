import { describe, expect, it } from "vitest";
import {
  buildSignatureHeader,
  verifySignature,
  generateWebhookSecret,
} from "@/lib/webhook-signer";

describe("buildSignatureHeader + verifySignature", () => {
  const secret = "whsec_test_secret_value_32_bytes_long_xx";
  const body = JSON.stringify({ event: "link.created", payload: { id: "abc" } });

  it("produce un header verificable con el mismo secret", () => {
    const header = buildSignatureHeader(body, secret);
    expect(header.startsWith("t=")).toBe(true);
    expect(header).toContain(",v1=");
    expect(verifySignature(body, secret, header)).toBe(true);
  });

  it("rechaza la firma con un secret distinto", () => {
    const header = buildSignatureHeader(body, secret);
    expect(verifySignature(body, "otro-secret", header)).toBe(false);
  });

  it("rechaza un cuerpo modificado", () => {
    const header = buildSignatureHeader(body, secret);
    expect(verifySignature(body + "tampered", secret, header)).toBe(false);
  });

  it("rechaza un header completamente inválido", () => {
    expect(verifySignature(body, secret, "garbage")).toBe(false);
    expect(verifySignature(body, secret, "")).toBe(false);
    expect(verifySignature(body, secret, "t=abc,v1=xx")).toBe(false);
  });

  it("respeta toleranceSeconds para rechazar firmas vencidas", () => {
    // Forzamos un timestamp 1h en el pasado.
    const oldTs = Math.floor(Date.now() / 1000) - 3600;
    const header = buildSignatureHeader(body, secret, oldTs);
    expect(
      verifySignature(body, secret, header, { toleranceSeconds: 300 })
    ).toBe(false);
    // Con tolerancia suficiente, sí pasa.
    expect(
      verifySignature(body, secret, header, { toleranceSeconds: 7200 })
    ).toBe(true);
  });

  it("usa comparación timing-safe (firmas de igual largo, distinto contenido)", () => {
    const headerA = buildSignatureHeader(body, secret);
    // Construye un header con la misma "t=" pero un hash hex modificado.
    const tampered = headerA.replace(/v1=[0-9a-f]+/, (m) => {
      const hex = m.slice(3);
      const swapped = hex[0] === "0" ? "1" + hex.slice(1) : "0" + hex.slice(1);
      return `v1=${swapped}`;
    });
    expect(verifySignature(body, secret, tampered)).toBe(false);
  });
});

describe("generateWebhookSecret", () => {
  it("usa el prefijo whsec_ y suficiente entropía", () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();
    expect(a).not.toBe(b);
    expect(a.startsWith("whsec_")).toBe(true);
    // 32 bytes hex = 64 chars + prefijo de 6
    expect(a.length).toBe(6 + 64);
  });
});
