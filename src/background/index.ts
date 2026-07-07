import { getPageDoc, getSettings } from "../shared/storage";
import { pageToMarkdown, type MarkdownLabels } from "../shared/markdown";
import { makeMarkdownFileName, normalizeUrl } from "../shared/url";

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "hlp-export-markdown",
    title: t("background_menu_export"),
    contexts: ["page"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "hlp-export-markdown" || !tab?.url) {
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
