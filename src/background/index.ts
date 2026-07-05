import { getPageDoc, getSettings } from "../shared/storage";
import { pageToMarkdown } from "../shared/markdown";
import { makeMarkdownFileName, normalizeUrl } from "../shared/url";

function downloadMarkdown(markdown: string, filename: string): Promise<void> {
  const url = `data:text/markdown;charset=utf-8,${encodeURIComponent(markdown)}`;
  return new Promise((resolve) => {
    chrome.downloads.download({ url, filename, saveAs: true }, () => resolve());
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "hlp-export-markdown",
    title: "Export highlights as Markdown",
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

  const markdown = pageToMarkdown(doc);
  const settings = await getSettings();
  await downloadMarkdown(markdown, makeMarkdownFileName(doc.title, new Date(), settings.fileNameTemplate));
});
