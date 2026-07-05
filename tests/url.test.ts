import { describe, expect, it } from "vitest";
import { makeMarkdownFileName, normalizeUrl, slugifyFileName } from "../src/shared/url";

describe("url helpers", () => {
  it("normalizes hash and query order", () => {
    expect(normalizeUrl("https://example.com/read?b=2&a=1#section")).toBe("https://example.com/read?a=1&b=2");
  });

  it("slugifies unsafe file names", () => {
    expect(slugifyFileName(" A / Strange: Title? ")).toBe("a-strange-title");
  });

  it("builds markdown file names", () => {
    expect(makeMarkdownFileName("A Title", new Date("2026-06-12T12:00:00.000Z"))).toBe("2026-06-12-a-title.md");
  });
});
