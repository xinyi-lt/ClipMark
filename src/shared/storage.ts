import type { Highlight, PageHighlightDoc, UserSettings } from "./types";
import { normalizeUrl } from "./url";

const PAGE_PREFIX = "hlp:page:";
const SETTINGS_KEY = "hlp:settings";

const DEFAULT_SETTINGS: UserSettings = {
  defaultColor: "yellow",
  fileNameTemplate: "{date}-{title}.md"
};

function pageKey(url: string): string {
  return `${PAGE_PREFIX}${normalizeUrl(url)}`;
}

function storageGet<T>(key: string): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key] as T | undefined));
  });
}

function storageSet(values: Record<string, unknown>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(values, () => resolve());
  });
}

export async function getSettings(): Promise<UserSettings> {
  return { ...DEFAULT_SETTINGS, ...(await storageGet<UserSettings>(SETTINGS_KEY)) };
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await storageSet({ [SETTINGS_KEY]: settings });
}

export async function getPageDoc(url: string): Promise<PageHighlightDoc | null> {
  return (await storageGet<PageHighlightDoc>(pageKey(url))) ?? null;
}

export async function ensurePageDoc(url: string, title: string): Promise<PageHighlightDoc> {
  const normalizedUrl = normalizeUrl(url);
  const existing = await getPageDoc(normalizedUrl);
  const now = new Date().toISOString();

  if (existing) {
    if (existing.title === title) {
      return existing;
    }

    const updated = { ...existing, title, updatedAt: now };
    await savePageDoc(updated);
    return updated;
  }

  const doc: PageHighlightDoc = {
    url: normalizedUrl,
    title,
    createdAt: now,
    updatedAt: now,
    highlights: []
  };
  await savePageDoc(doc);
  return doc;
}

export async function savePageDoc(doc: PageHighlightDoc): Promise<void> {
  await storageSet({ [pageKey(doc.url)]: doc });
}

export async function upsertHighlight(url: string, title: string, highlight: Highlight): Promise<PageHighlightDoc> {
  const doc = await ensurePageDoc(url, title);
  const existingIndex = doc.highlights.findIndex((item) => item.id === highlight.id);
  const now = new Date().toISOString();
  const highlights =
    existingIndex >= 0
      ? doc.highlights.map((item) => (item.id === highlight.id ? { ...highlight, updatedAt: now } : item))
      : [...doc.highlights, highlight];

  const updated = {
    ...doc,
    title,
    updatedAt: now,
    highlights: highlights.sort((a, b) => a.order - b.order)
  };
  await savePageDoc(updated);
  return updated;
}

export async function updateHighlightNote(url: string, id: string, note: string): Promise<PageHighlightDoc | null> {
  const doc = await getPageDoc(url);

  if (!doc) {
    return null;
  }

  const now = new Date().toISOString();
  const updated = {
    ...doc,
    updatedAt: now,
    highlights: doc.highlights.map((highlight) =>
      highlight.id === id ? { ...highlight, note, updatedAt: now } : highlight
    )
  };

  await savePageDoc(updated);
  return updated;
}

export async function deleteHighlight(url: string, id: string): Promise<PageHighlightDoc | null> {
  const doc = await getPageDoc(url);

  if (!doc) {
    return null;
  }

  const updated = {
    ...doc,
    updatedAt: new Date().toISOString(),
    highlights: doc.highlights.filter((highlight) => highlight.id !== id)
  };

  await savePageDoc(updated);
  return updated;
}
