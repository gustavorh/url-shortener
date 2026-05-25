import { describe, it, expect } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves plain values unquoted", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
  });

  it("renders null/undefined as empty", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes and escapes values with delimiters or quotes", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
  });
});

describe("toCsv", () => {
  it("builds a CSV document from a header and rows", () => {
    const csv = toCsv(
      ["name", "clicks"],
      [
        ["link-a", 3],
        ["link, b", 0],
      ]
    );
    expect(csv).toBe('name,clicks\r\nlink-a,3\r\n"link, b",0');
  });
});
