import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { pageToMarkdown, type MarkdownLabels } from "../shared/markdown";
import { getPageDoc, getSettings, updateHighlightNote } from "../shared/storage";
import type { Highlight, PageHighlightDoc } from "../shared/types";
import { makeMarkdownFileName, normalizeUrl } from "../shared/url";
import "./styles.css";

const t = (key: string, substitutions?: string[]) => chrome.i18n.getMessage(key, substitutions);

function plainTextLabels() {
  return {
    sourceLabel: t("plaintext_source_label"),
    highlightLabel: t("plaintext_highlight_label"),
    noteLabel: t("plaintext_note_label")
  };
}

function markdownLabels(): MarkdownLabels {
  return {
    untitled: t("markdown_untitled"),
    sourceLabel: t("markdown_source_label"),
    exportedLabel: t("markdown_exported_label"),
    highlightsSection: t("markdown_highlights_section"),
    noteLabel: t("markdown_note_label")
  };
}

if (typeof document !== "undefined") {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.title = t("popup_title");
}

type ActiveTab = {
  id: number;
  url: string;
};

async function getActiveTab(): Promise<ActiveTab | null> {
  const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, resolve);
  });
  const tab = tabs[0];

  return tab?.id && tab.url && /^https?:\/\//.test(tab.url) ? { id: tab.id, url: normalizeUrl(tab.url) } : null;
}

function sendRefreshMessage(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "HLP_REFRESH" }, () => {
      // content script may be absent (page just reloaded, restricted URL);
      // resolve false so the caller can surface that instead of failing silently.
      resolve(!chrome.runtime.lastError);
    });
  });
}

function pageToPlainText(doc: PageHighlightDoc): string {
  const labels = plainTextLabels();
  const lines: string[] = [doc.title, `${labels.sourceLabel}${doc.url}`, ""];

  for (const [index, highlight] of doc.highlights.entries()) {
    lines.push(`${index + 1}. ${labels.highlightLabel}`);
    lines.push(highlight.text.trim());

    if (highlight.note.trim()) {
      lines.push("", labels.noteLabel, highlight.note.trim());
    }

    lines.push("", "---", "");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function downloadMarkdownFile(markdown: string, filename: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  return new Promise((resolve) => {
    chrome.downloads.download({ url, filename, saveAs: true }, () => {
      URL.revokeObjectURL(url);
      resolve();
    });
  });
}

function HighlightItem({
  highlight,
  pageUrl,
  onUpdated
}: {
  highlight: Highlight;
  pageUrl: string;
  onUpdated: (doc: PageHighlightDoc) => void;
}) {
  const [note, setNote] = useState(highlight.note);
  const [savedVisible, setSavedVisible] = useState(false);

  useEffect(() => {
    setNote(highlight.note);
  }, [highlight.note]);

  const saveNote = useCallback(async () => {
    const doc = await updateHighlightNote(pageUrl, highlight.id, note);
    if (doc) {
      onUpdated(doc);
      setSavedVisible(true);
      window.setTimeout(() => setSavedVisible(false), 1500);
      const activeTab = await getActiveTab();
      if (activeTab) {
        await sendRefreshMessage(activeTab.id);
        // ignore the boolean: note save still succeeded even if the page
        // can't be refreshed right now.
      }
    }
  }, [highlight.id, note, onUpdated, pageUrl]);

  return (
    <article className="highlight-item">
      <div className="highlight-meta">
        <span className={`color-dot color-${highlight.color}`} />
        {highlight.isOrphaned ? <span>{t("popup_highlight_orphaned")}</span> : null}
      </div>
      <blockquote>{highlight.text}</blockquote>
      <textarea
        aria-label={t("popup_note_aria")}
        placeholder={t("popup_note_placeholder")}
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="note-actions-inline">
        <button type="button" onClick={saveNote}>
          {t("popup_btn_save_note")}
        </button>
        {savedVisible ? <span className="note-saved-feedback">{t("popup_status_note_saved")}</span> : null}
      </div>
    </article>
  );
}

function App() {
  const [tab, setTab] = useState<ActiveTab | null>(null);
  const [doc, setDoc] = useState<PageHighlightDoc | null>(null);
  const [status, setStatus] = useState(t("popup_status_loading"));
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const activeTab = await getActiveTab();
      if (!activeTab) {
        setStatus(t("popup_status_open_web_page"));
        return;
      }

      const pageDoc = await getPageDoc(activeTab.url);
      if (!cancelled) {
        setTab(activeTab);
        setDoc(pageDoc);
        setStatus(pageDoc ? "" : t("popup_status_no_highlights"));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const markdown = useMemo(() => (doc ? pageToMarkdown(doc, new Date(), markdownLabels()) : ""), [doc]);
  const plainText = useMemo(() => (doc ? pageToPlainText(doc) : ""), [doc]);

  const copyMarkdown = useCallback(async () => {
    if (!markdown) {
      return;
    }

    await navigator.clipboard.writeText(markdown);
    setStatus(t("popup_status_copied"));
  }, [markdown]);

  const copyPlainText = useCallback(async () => {
    if (!plainText) {
      return;
    }

    await navigator.clipboard.writeText(plainText);
    setStatus(t("popup_status_plain_copied"));
  }, [plainText]);

  const downloadMarkdown = useCallback(async () => {
    if (!doc || !markdown) {
      return;
    }

    const settings = await getSettings();
    await downloadMarkdownFile(markdown, makeMarkdownFileName(doc.title, new Date(), settings.fileNameTemplate));
  }, [doc, markdown]);

  const refreshPage = useCallback(async () => {
    if (!tab) {
      return;
    }

    setRefreshing(true);
    const reached = await sendRefreshMessage(tab.id);
    const pageDoc = await getPageDoc(tab.url);
    setDoc(pageDoc);
    setRefreshing(false);
    setStatus(reached ? t("popup_status_refreshed") : t("popup_status_refresh_failed"));
    if (reached) {
      window.setTimeout(() => setStatus(""), 1500);
    }
  }, [tab]);

  const hasHighlights = Boolean(doc?.highlights.length);

  return (
    <main>
      <header>
        <div>
          <h1>{t("popup_title")}</h1>
          <p>{doc?.title ?? status}</p>
        </div>
        <button
          type="button"
          className={`icon-button${refreshing ? " is-spinning" : ""}`}
          title={t("popup_btn_refresh_title")}
          disabled={refreshing}
          onClick={refreshPage}
        >
          R
        </button>
      </header>

      <section className="actions">
        <button type="button" disabled={!hasHighlights} onClick={copyMarkdown}>
          {t("popup_btn_copy")}
        </button>
        <button type="button" disabled={!hasHighlights} onClick={copyPlainText}>
          {t("popup_btn_copy_plain")}
        </button>
        <button type="button" disabled={!hasHighlights} onClick={downloadMarkdown}>
          {t("popup_btn_export")}
        </button>
      </section>

      {status ? <p className="status">{status}</p> : null}

      <section className="list" aria-label={t("popup_section_highlights")}>
        {doc?.highlights.map((highlight) => (
          <HighlightItem key={highlight.id} highlight={highlight} pageUrl={doc.url} onUpdated={setDoc} />
        ))}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
