import type { PageHighlightDoc } from "./types";

function escapeMarkdownBlockquote(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => `> ${line.replace(/^>/, "\\>")}`)
    .join("\n");
}

function escapeInline(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

export function pageToMarkdown(doc: PageHighlightDoc, exportedAt = new Date()): string {
  const lines: string[] = [
    `# ${escapeInline(doc.title || "Untitled")}`,
    "",
    `Source: ${doc.url}`,
    `Exported: ${exportedAt.toISOString()}`,
    "",
    "## Highlights",
    ""
  ];

  for (const highlight of doc.highlights) {
    lines.push(escapeMarkdownBlockquote(highlight.text));

    if (highlight.note.trim()) {
      lines.push("", `Note: ${escapeInline(highlight.note)}`);
    }

    lines.push("", "---", "");
  }

  return lines.join("\n").trimEnd() + "\n";
}
