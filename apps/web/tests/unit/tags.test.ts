import { describe, it, expect } from "vitest";
import { parseTags, serializeTags, splitTags } from "@/lib/tags";

describe("parseTags", () => {
  it("normalizes, lowercases and hyphenates", () => {
    expect(parseTags("Marketing, Black Friday")).toEqual([
      "marketing",
      "black-friday",
    ]);
  });

  it("dedupes and drops empty entries", () => {
    expect(parseTags("a, a, , b")).toEqual(["a", "b"]);
  });

  it("strips disallowed characters", () => {
    expect(parseTags("hello!@#, ok")).toEqual(["hello", "ok"]);
  });

  it("caps the number of tags at 8", () => {
    const many = Array.from({ length: 20 }, (_, i) => `t${i}`).join(",");
    expect(parseTags(many)).toHaveLength(8);
  });
});

describe("serializeTags / splitTags", () => {
  it("round-trips a tag list", () => {
    expect(splitTags(serializeTags(["a", "b"]))).toEqual(["a", "b"]);
  });

  it("serializes an empty list to null", () => {
    expect(serializeTags([])).toBeNull();
  });

  it("splits null/undefined to an empty array", () => {
    expect(splitTags(null)).toEqual([]);
    expect(splitTags(undefined)).toEqual([]);
  });
});
