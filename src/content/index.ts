import {
  deleteHighlight,
  ensurePageDoc,
  getPageDoc,
  getSettings,
  savePageDoc,
  updateHighlightNote,
  upsertHighlight
} from "../shared/storage";
import type { ContentMessage, ContentResponse, Highlight, HighlightColor, PageHighlightDoc } from "../shared/types";
import { createSelectorFromRange, findRangeFromSelector, getTextNodes } from "../shared/selector";
import { normalizeUrl } from "../shared/url";

const HIGHLIGHT_ATTR = "data-hlp-id";
const ROOT_ATTR = "data-hlp-root";
const COLOR_KEYS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

const t = (key: string, substitutions?: string[]) => chrome.i18n.getMessage(key, substitutions);

function colorLabel(color: HighlightColor): string {
  return t(`content_color_${color}`);
}

function colorTooltip(color: HighlightColor): string {
  return t("content_color_tooltip", [colorLabel(color)]);
}

let toolbar: HTMLDivElement | null = null;
let noteEditor: HTMLDivElement | null = null;
let activeDoc: PageHighlightDoc | null = null;

function currentUrl(): string {
  return normalizeUrl(window.location.href);
}

function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function removeToolbar(): void {
  toolbar?.remove();
  toolbar = null;
}

function removeNoteEditor(): void {
  noteEditor?.remove();
  noteEditor = null;
}

function clampToViewport(rect: DOMRect, width = 260): { left: number; top: number } {
  return {
    left: Math.min(Math.max(12, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 12),
    top: Math.max(12, rect.top - 46)
  };
}

function unwrapExistingHighlights(): void {
  const marks = Array.from(document.querySelectorAll(`mark[${HIGHLIGHT_ATTR}]`));

  for (const mark of marks) {
    const parent = mark.parentNode;
    if (!parent) {
      continue;
    }

    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    mark.remove();
    parent.normalize();
  }
}

type TextSegment = {
  node: Text;
  start: number;
  end: number;
};

function rangeTextSegments(range: Range): TextSegment[] {
  return getTextNodes(document.body)
    .filter((node) => range.intersectsNode(node))
    .map((node) => {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.data.length;
      return { node, start, end };
    })
    .filter((segment) => segment.end > segment.start);
}

function wrapSegment(segment: TextSegment, highlight: Highlight): void {
  const selected = segment.node.splitText(segment.start);
  selected.splitText(segment.end - segment.start);

  const mark = document.createElement("mark");
  mark.setAttribute(HIGHLIGHT_ATTR, highlight.id);
  mark.dataset.hlpColor = highlight.color;
  mark.title = highlight.note ? t("content_mark_title_note", [highlight.note]) : t("content_mark_title_add");

  selected.parentNode?.insertBefore(mark, selected);
  mark.appendChild(selected);
}

function applyHighlightRange(range: Range, highlight: Highlight): boolean {
  const segments = rangeTextSegments(range).reverse();

  if (!segments.length) {
    return false;
  }

  for (const segment of segments) {
    if (segment.node.parentElement?.closest(`mark[${HIGHLIGHT_ATTR}]`)) {
      continue;
    }
    wrapSegment(segment, highlight);
  }

  return true;
}

async function renderHighlights(): Promise<void> {
  unwrapExistingHighlights();
  activeDoc = await getPageDoc(currentUrl());

  if (!activeDoc) {
    return;
  }

  let changed = false;
  const rendered = activeDoc.highlights.map((highlight) => {
    const range = findRangeFromSelector(document.body, highlight.selector);
    const isRendered = Boolean(range && applyHighlightRange(range, highlight));

    if (highlight.isOrphaned === !isRendered) {
      return highlight;
    }

    changed = true;
    return { ...highlight, isOrphaned: !isRendered };
  });

  if (changed) {
    activeDoc = { ...activeDoc, highlights: rendered };
    await savePageDoc(activeDoc);
  }
}

async function createHighlight(color: HighlightColor): Promise<void> {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return;
  }

  const range = selection.getRangeAt(0);
  if (!document.body.contains(range.commonAncestorContainer)) {
    return;
  }

  const exact = range.toString().trim();
  if (!exact) {
    return;
  }

  const selector = createSelectorFromRange(document.body, range);
  const now = new Date().toISOString();
  const doc = await ensurePageDoc(currentUrl(), document.title);
  const highlight: Highlight = {
    id: makeId(),
    text: selector.exact,
    note: "",
    color,
    createdAt: now,
    updatedAt: now,
    selector,
    order: doc.highlights.length
  };

  await upsertHighlight(currentUrl(), document.title, highlight);
  selection.removeAllRanges();
  removeToolbar();
  await renderHighlights();
}

async function showToolbar(): Promise<void> {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    removeToolbar();
    return;
  }

  const range = selection.getRangeAt(0);
  if (!document.body.contains(range.commonAncestorContainer) || !range.toString().trim()) {
    removeToolbar();
    return;
  }

  const settings = await getSettings();
  const selectedText = range.toString().trim();
  const rect = range.getBoundingClientRect();
  const position = clampToViewport(rect, 260);
  removeToolbar();

  toolbar = document.createElement("div");
  toolbar.className = "hlp-toolbar";
  toolbar.setAttribute(ROOT_ATTR, "toolbar");
  toolbar.style.left = `${position.left}px`;
  toolbar.style.top = `${position.top}px`;

  for (const color of COLOR_KEYS) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = color === settings.defaultColor ? "*" : "o";
    button.title = colorTooltip(color);
    button.dataset.color = color;
    button.addEventListener("click", () => void createHighlight(color));
    toolbar.appendChild(button);
  }

  const divider = document.createElement("span");
  divider.className = "hlp-toolbar-divider";
  toolbar.appendChild(divider);

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "hlp-copy-btn";
  copyButton.title = t("content_btn_copy");
  copyButton.setAttribute("aria-label", t("content_btn_copy"));
  copyButton.innerHTML =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>';
  copyButton.addEventListener("click", async () => {
    if (!selectedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedText);
      copyButton.classList.add("is-copied");
      copyButton.title = t("content_btn_copied");
      copyButton.innerHTML =
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>';
      window.setTimeout(() => removeToolbar(), 900);
    } catch {
      /* clipboard blocked; keep toolbar so the user can retry */
    }
  });
  toolbar.appendChild(copyButton);

  document.body.appendChild(toolbar);
}

function editorPositionFromElement(element: Element): { left: number; top: number } {
  const rect = element.getBoundingClientRect();
  return {
    left: Math.min(Math.max(12, rect.left), window.innerWidth - 332),
    top: Math.min(rect.bottom + 8, window.innerHeight - 180)
  };
}

function showNoteEditor(highlight: Highlight, target: Element): void {
  removeNoteEditor();
  const position = editorPositionFromElement(target);
  noteEditor = document.createElement("div");
  noteEditor.className = "hlp-note-editor";
  noteEditor.setAttribute(ROOT_ATTR, "note-editor");
  noteEditor.style.left = `${position.left}px`;
  noteEditor.style.top = `${position.top}px`;

  const textarea = document.createElement("textarea");
  textarea.value = highlight.note;
  textarea.placeholder = t("content_editor_placeholder");

  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const saveNote = async () => {
    await updateHighlightNote(currentUrl(), highlight.id, textarea.value);
    await renderHighlights();
  };

  textarea.addEventListener("input", () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }
    saveTimer = setTimeout(() => void saveNote(), 600);
  });

  const actions = document.createElement("div");
  actions.className = "hlp-note-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = t("content_btn_delete");
  deleteButton.dataset.variant = "danger";
  deleteButton.addEventListener("click", async () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await deleteHighlight(currentUrl(), highlight.id);
    removeNoteEditor();
    await renderHighlights();
  });

  const doneButton = document.createElement("button");
  doneButton.type = "button";
  doneButton.textContent = t("content_btn_done");
  doneButton.addEventListener("click", async () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    await saveNote();
    removeNoteEditor();
  });

  actions.append(deleteButton, doneButton);
  noteEditor.append(textarea, actions);
  document.body.appendChild(noteEditor);
  textarea.focus();
}

function handleDocumentClick(event: MouseEvent): void {
  const target = event.target as Element | null;

  if (!target) {
    return;
  }

  if (target.closest(`[${ROOT_ATTR}]`)) {
    return;
  }

  const mark = target.closest(`mark[${HIGHLIGHT_ATTR}]`);
  if (!mark) {
    removeNoteEditor();
    return;
  }

  const id = mark.getAttribute(HIGHLIGHT_ATTR);
  const highlight = activeDoc?.highlights.find((item) => item.id === id);

  if (highlight) {
    event.preventDefault();
    event.stopPropagation();
    showNoteEditor(highlight, mark);
  }
}

async function init(): Promise<void> {
  await renderHighlights();

  document.addEventListener("selectionchange", () => {
    window.setTimeout(() => void showToolbar(), 120);
  });

  document.addEventListener("mousedown", (event) => {
    const target = event.target as Element | null;
    if (!target?.closest(`[${ROOT_ATTR}]`)) {
      removeToolbar();
    }
  });

  document.addEventListener("click", handleDocumentClick, true);

  chrome.runtime.onMessage.addListener(
    (message: ContentMessage, _sender, sendResponse: (response: ContentResponse) => void) => {
      if (message.type === "HLP_REFRESH") {
        void renderHighlights().then(() => sendResponse({ ok: true, doc: activeDoc }));
        return true;
      }

      if (message.type === "HLP_GET_PAGE_STATE") {
        void getPageDoc(currentUrl()).then((doc) => sendResponse({ ok: true, doc }));
        return true;
      }

      return false;
    }
  );
}

void init();
