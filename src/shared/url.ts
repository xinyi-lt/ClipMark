const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function normalizeUrl(url: string): string {
  const parsed = new URL(url);
  parsed.hash = "";
  parsed.searchParams.sort();
  return parsed.toString();
}

export function slugifyFileName(value: string): string {
  const slug = value
    .trim()
    .replace(INVALID_FILENAME_CHARS, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return slug || "untitled";
}

export function makeMarkdownFileName(
  title: string,
  exportedAt = new Date(),
  template = "{date}-{title}.md"
): string {
  const date = exportedAt.toISOString().slice(0, 10);
  const fileName = template.replace("{date}", date).replace("{title}", slugifyFileName(title));
  return fileName.endsWith(".md") ? fileName : `${fileName}.md`;
}
