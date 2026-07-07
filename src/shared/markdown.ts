import type { PageHighlightDoc } from "./types";

export type MarkdownLabels = {
  untitled: string;
  sourceLabel: string;
  exportedLabel: string;
  highlightsSection: string;
  noteLabel: string;
};

export const DEFAULT_MARKDOWN_LABELS: MarkdownLabels = {
  untitled: "Untitled",
  sourceLabel: "Source: ",
  exportedLabel: "Exported: ",
  highlightsSection: "## Highlights",
  noteLabel: "Note: "
};

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

export function pageToMarkdown(
  doc: PageHighlightDoc,
  exportedAt = new Date(),
  labels: MarkdownLabels = DEFAULT_MARKDOWN_LABELS
): string {
  const lines: string[] = [
    `# ${escapeInline(doc.title || labels.untitled)}`,
    "",
    `${labels.sourceLabel}${doc.url}`,
    `${labels.exportedLabel}${exportedAt.toISOString()}`,
    "",
    labels.highlightsSection,
    ""
  ];

  for (const highlight of doc.highlights) {
    lines.push(escapeMarkdownBlockquote(highlight.text));

    if (highlight.note.trim()) {
      lines.push("", `${labels.noteLabel}${escapeInline(highlight.note)}`);
    }

    lines.push("", "---", "");
  }

  return lines.join("\n").trimEnd() + "\n";
}
