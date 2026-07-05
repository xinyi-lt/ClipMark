import type { TextQuoteSelector } from "./types";

const CONTEXT_LENGTH = 80;
const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "SELECT", "OPTION"]);

type TextNodeSpan = {
  node: Text;
  start: number;
  end: number;
};

function canUseTextNode(node: Text): boolean {
  const parent = node.parentElement;
  return Boolean(parent && !SKIPPED_TAGS.has(parent.tagName) && !parent.closest("[data-hlp-root], mark[data-hlp-id]"));
}

export function getTextNodes(root: ParentNode): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent?.trim() || !canUseTextNode(node as Text)) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
}

export function getDocumentText(root: ParentNode): string {
  return getTextNodes(root)
    .map((node) => node.data)
    .join("");
}

function getNodeSpans(root: ParentNode): TextNodeSpan[] {
  let offset = 0;
  return getTextNodes(root).map((node) => {
    const start = offset;
    const end = start + node.data.length;
    offset = end;
    return { node, start, end };
  });
}

function rangeOffset(root: HTMLElement, range: Range, boundary: "start" | "end"): number {
  const probe = document.createRange();
  probe.selectNodeContents(root);

  if (boundary === "start") {
    probe.setEnd(range.startContainer, range.startOffset);
  } else {
    probe.setEnd(range.endContainer, range.endOffset);
  }

  return probe.toString().length;
}

export function createSelectorFromRange(root: HTMLElement, range: Range): TextQuoteSelector {
  const exact = range.toString();
  const documentText = getDocumentText(root);
  const startOffset = rangeOffset(root, range, "start");
  const endOffset = startOffset + exact.length;

  return {
    exact,
    prefix: documentText.slice(Math.max(0, startOffset - CONTEXT_LENGTH), startOffset),
    suffix: documentText.slice(endOffset, endOffset + CONTEXT_LENGTH),
    startOffset,
    endOffset
  };
}

function scoreCandidate(text: string, selector: TextQuoteSelector, start: number): number {
  const end = start + selector.exact.length;
  let score = 0;

  if (selector.prefix && text.slice(Math.max(0, start - selector.prefix.length), start) === selector.prefix) {
    score += selector.prefix.length;
  }

  if (selector.suffix && text.slice(end, end + selector.suffix.length) === selector.suffix) {
    score += selector.suffix.length;
  }

  if (selector.startOffset !== undefined) {
    score -= Math.abs(selector.startOffset - start) / 1000;
  }

  return score;
}

function findTextOffset(text: string, selector: TextQuoteSelector): number {
  if (!selector.exact) {
    return -1;
  }

  if (
    selector.startOffset !== undefined &&
    text.slice(selector.startOffset, selector.startOffset + selector.exact.length) === selector.exact
  ) {
    return selector.startOffset;
  }

  let bestStart = -1;
  let bestScore = Number.NEGATIVE_INFINITY;
  let cursor = text.indexOf(selector.exact);

  while (cursor >= 0) {
    const score = scoreCandidate(text, selector, cursor);
    if (score > bestScore) {
      bestScore = score;
      bestStart = cursor;
    }
    cursor = text.indexOf(selector.exact, cursor + 1);
  }

  return bestStart;
}

export function findRangeFromSelector(root: HTMLElement, selector: TextQuoteSelector): Range | null {
  const spans = getNodeSpans(root);
  const text = spans.map((span) => span.node.data).join("");
  const start = findTextOffset(text, selector);

  if (start < 0) {
    return null;
  }

  const end = start + selector.exact.length;
  const startSpan = spans.find((span) => start >= span.start && start <= span.end);
  const endSpan = spans.find((span) => end >= span.start && end <= span.end);

  if (!startSpan || !endSpan) {
    return null;
  }

  const range = document.createRange();
  range.setStart(startSpan.node, start - startSpan.start);
  range.setEnd(endSpan.node, end - endSpan.start);
  return range;
}
