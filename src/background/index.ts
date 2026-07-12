import { getPageDoc, getSettings } from "../shared/storage";
import { pageToMarkdown, type MarkdownLabels } from "../shared/markdown";
import { makeMarkdownFileName, normalizeUrl } from "../shared/url";
import type { ContentMessage } from "../shared/types";

const HIGHLIGHT_MENU_ID = "hlp-highlight-selection";
const EXPORT_MENU_ID = "hlp-export-markdown";
const WEB_PAGE_PATTERNS = ["http://*/*", "https://*/*"];

const t = (key: string, substitutions?: string[]) => chrome.i18n.getMessage(key, substitutions);

function markdownLabels(): MarkdownLabels {
  return {
    untitled: t("markdown_untitled"),
    sourceLabel: t("markdown_source_label"),
    exportedLabel: t("markdown_exported_label"),
    highlightsSection: t("markdown_highlights_section"),
    noteLabel: t("markdown_note_label")
  };
}

function downloadMarkdown(markdown: string, filename: string): Promise<void> {
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
  return new Promise((resolve) => {
    chrome.downloads.download({ url, filename, saveAs: true }, () => resolve());
  });
}

function registerContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: HIGHLIGHT_MENU_ID,
      title: t("background_menu_highlight"),
      contexts: ["selection"],
      documentUrlPatterns: WEB_PAGE_PATTERNS
    });
    chrome.contextMenus.create({
      id: EXPORT_MENU_ID,
      title: t("background_menu_export"),
      contexts: ["page"],
      documentUrlPatterns: WEB_PAGE_PATTERNS
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  registerContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === HIGHLIGHT_MENU_ID) {
    if (tab?.id === undefined) {
      return;
    }

    const message: ContentMessage = { type: "HLP_CREATE_HIGHLIGHT" };
    chrome.tabs.sendMessage(tab.id, message, () => void chrome.runtime.lastError);
    return;
  }

  if (info.menuItemId !== EXPORT_MENU_ID || !tab?.url) {
    return;
  }

  const doc = await getPageDoc(normalizeUrl(tab.url));
  if (!doc) {
    return;
  }

  const markdown = pageToMarkdown(doc, new Date(), markdownLabels());
  const settings = await getSettings();
  await downloadMarkdown(markdown, makeMarkdownFileName(doc.title, new Date(), settings.fileNameTemplate));
});
