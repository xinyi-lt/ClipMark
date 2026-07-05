import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { pageToMarkdown } from "../shared/markdown";
import { getPageDoc, getSettings, updateHighlightNote } from "../shared/storage";
import type { Highlight, PageHighlightDoc } from "../shared/types";
import { makeMarkdownFileName, normalizeUrl } from "../shared/url";
import "./styles.css";

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

function sendRefreshMessage(tabId: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: "HLP_REFRESH" }, () => resolve());
  });
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

  useEffect(() => {
    setNote(highlight.note);
  }, [highlight.note]);

  const saveNote = useCallback(async () => {
    const doc = await updateHighlightNote(pageUrl, highlight.id, note);
    if (doc) {
      onUpdated(doc);
      const activeTab = await getActiveTab();
      if (activeTab) {
        await sendRefreshMessage(activeTab.id);
      }
    }
  }, [highlight.id, note, onUpdated, pageUrl]);

  return (
    <article className="highlight-item">
      <div className="highlight-meta">
        <span className={`color-dot color-${highlight.color}`} />
        <span>{highlight.isOrphaned ? "Not found on page" : "On page"}</span>
      </div>
      <blockquote>{highlight.text}</blockquote>
      <textarea
        aria-label="Highlight note"
        placeholder="Add note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <button type="button" onClick={saveNote}>
        Save note
      </button>
    </article>
  );
}

function App() {
  const [tab, setTab] = useState<ActiveTab | null>(null);
  const [doc, setDoc] = useState<PageHighlightDoc | null>(null);
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const activeTab = await getActiveTab();
      if (!activeTab) {
        setStatus("Open a regular web page to use ClipMark.");
        return;
      }

      const pageDoc = await getPageDoc(activeTab.url);
      if (!cancelled) {
        setTab(activeTab);
        setDoc(pageDoc);
        setStatus(pageDoc ? "" : "No highlights on this page yet.");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const markdown = useMemo(() => (doc ? pageToMarkdown(doc) : ""), [doc]);

  const copyMarkdown = useCallback(async () => {
    if (!markdown) {
      return;
    }

    await navigator.clipboard.writeText(markdown);
    setStatus("Markdown copied.");
  }, [markdown]);

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

    await sendRefreshMessage(tab.id);
    const pageDoc = await getPageDoc(tab.url);
    setDoc(pageDoc);
  }, [tab]);

  const hasHighlights = Boolean(doc?.highlights.length);

  return (
    <main>
      <header>
        <div>
          <h1>ClipMark</h1>
          <p>{doc?.title ?? status}</p>
        </div>
        <button type="button" className="icon-button" title="Refresh page highlights" onClick={refreshPage}>
          R
        </button>
      </header>

      <section className="actions">
        <button type="button" disabled={!hasHighlights} onClick={copyMarkdown}>
          Copy Markdown
        </button>
        <button type="button" disabled={!hasHighlights} onClick={downloadMarkdown}>
          Export .md
        </button>
      </section>

      {status ? <p className="status">{status}</p> : null}

      <section className="list" aria-label="Current page highlights">
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
