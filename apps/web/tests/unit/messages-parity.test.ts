import { describe, expect, it } from "vitest";
import es from "@/messages/es.json";
import en from "@/messages/en.json";

type Bundle = Record<string, Record<string, string>>;

function flatten(b: Bundle): string[] {
  const out: string[] = [];
  for (const namespace of Object.keys(b)) {
    for (const key of Object.keys(b[namespace] ?? {})) {
      out.push(`${namespace}.${key}`);
    }
  }
  return out.sort();
}

describe("messages parity (es / en)", () => {
  const esKeys = flatten(es as Bundle);
  const enKeys = flatten(en as Bundle);

  it("every Spanish key has an English translation (and vice versa)", () => {
    const missingInEn = esKeys.filter((k) => !enKeys.includes(k));
    const missingInEs = enKeys.filter((k) => !esKeys.includes(k));
    expect(
      missingInEn,
      "keys present in es.json but missing in en.json"
    ).toEqual([]);
    expect(
      missingInEs,
      "keys present in en.json but missing in es.json"
    ).toEqual([]);
  });

  it("no translation is the empty string", () => {
    function check(bundle: Bundle, name: string) {
      for (const ns of Object.keys(bundle)) {
        for (const k of Object.keys(bundle[ns])) {
          const v = bundle[ns][k];
          expect(v.length, `${name} ${ns}.${k} is empty`).toBeGreaterThan(0);
        }
      }
    }
    check(es as Bundle, "es");
    check(en as Bundle, "en");
  });
});
