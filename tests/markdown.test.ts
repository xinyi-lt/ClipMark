import { describe, expect, it } from "vitest";
import { pageToMarkdown } from "../src/shared/markdown";
import type { PageHighlightDoc } from "../src/shared/types";

function makeDoc(): PageHighlightDoc {
  return {
    url: "https://example.com/article",
    title: "Example Article",
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    highlights: [
      {
        id: "one",
        text: "First highlight",
        note: "Useful note",
        color: "yellow",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
        order: 0,
        selector: { exact: "First highlight", prefix: "", suffix: "" }
      },
      {
        id: "two",
        text: "Second\nhighlight",
        note: "",
        color: "green",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
        order: 1,
        selector: { exact: "Second\nhighlight", prefix: "", suffix: "" }
      }
    ]
  };
}

describe("pageToMarkdown", () => {
  it("exports highlights and notes", () => {
    const markdown = pageToMarkdown(makeDoc(), new Date("2026-06-12T12:00:00.000Z"));

    expect(markdown).toContain("# Example Article");
    expect(markdown).toContain("Source: https://example.com/article");
    expect(markdown).toContain("> First highlight");
    expect(markdown).toContain("Note: Useful note");
    expect(markdown).toContain("> Second\n> highlight");
  });

  it("omits empty notes", () => {
    const markdown = pageToMarkdown(makeDoc());

    expect(markdown.match(/Note:/g)).toHaveLength(1);
  });
});
