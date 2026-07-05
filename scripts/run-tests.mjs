import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { pageToMarkdown } from "../src/shared/markdown.ts";
import { createSelectorFromRange, findRangeFromSelector } from "../src/shared/selector.ts";
import { makeMarkdownFileName, normalizeUrl, slugifyFileName } from "../src/shared/url.ts";

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function installDom(html = "") {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`);
  globalThis.document = dom.window.document;
  globalThis.NodeFilter = dom.window.NodeFilter;
  return dom.window.document.body;
}

function makeDoc() {
  return {
    url: "https://example.com/article",
    title: "Example Article",
    createdAt: "2026-06-12T00:00:00.000Z",
    updatedAt: "2026-06-12T00:00:00.000Z",
    highlights: [
      {
        id: "one",
        text: "First highlight",
        note: "Useful note",
        color: "yellow",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
        order: 0,
        selector: { exact: "First highlight", prefix: "", suffix: "" }
      },
      {
        id: "two",
        text: "Second\nhighlight",
        note: "",
        color: "green",
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:00.000Z",
        order: 1,
        selector: { exact: "Second\nhighlight", prefix: "", suffix: "" }
      }
    ]
  };
}

test("pageToMarkdown exports highlights and notes", () => {
  const markdown = pageToMarkdown(makeDoc(), new Date("2026-06-12T12:00:00.000Z"));

  assert.match(markdown, /# Example Article/);
  assert.match(markdown, /Source: https:\/\/example\.com\/article/);
  assert.match(markdown, /> First highlight/);
  assert.match(markdown, /Note: Useful note/);
  assert.match(markdown, /> Second\n> highlight/);
  assert.equal(markdown.match(/Note:/g).length, 1);
});

test("url helpers normalize, slugify, and build file names", () => {
  assert.equal(normalizeUrl("https://example.com/read?b=2&a=1#section"), "https://example.com/read?a=1&b=2");
  assert.equal(slugifyFileName(" A / Strange: Title? "), "a-strange-title");
  assert.equal(makeMarkdownFileName("A Title", new Date("2026-06-12T12:00:00.000Z")), "2026-06-12-a-title.md");
});

test("selector creates and restores a normal paragraph range", () => {
  const root = installDom("<main><p>Alpha beta gamma delta.</p></main>");
  const text = root.querySelector("p").firstChild;
  const range = document.createRange();
  range.setStart(text, 6);
  range.setEnd(text, 16);

  const selector = createSelectorFromRange(root, range);
  const restored = findRangeFromSelector(root, selector);

  assert.equal(selector.exact, "beta gamma");
  assert.equal(restored?.toString(), "beta gamma");
});

test("selector uses prefix and suffix for repeated text", () => {
  const root = installDom("<p>Alpha repeat omega. Beta repeat sigma.</p>");
  const text = root.querySelector("p").firstChild;
  const value = text.textContent;
  const start = value.indexOf("repeat", value.indexOf("Beta"));
  const range = document.createRange();
  range.setStart(text, start);
  range.setEnd(text, start + "repeat".length);

  const selector = createSelectorFromRange(root, range);
  const restored = findRangeFromSelector(root, selector);

  assert.equal(restored?.toString(), "repeat");
  assert.match(selector.prefix, /Beta /);
  assert.match(selector.suffix, / sigma/);
});

test("selector returns null when text cannot be found", () => {
  const root = installDom("<p>Only local text.</p>");
  assert.equal(findRangeFromSelector(root, { exact: "missing", prefix: "", suffix: "" }), null);
});

let failed = 0;

for (const item of tests) {
  try {
    await item.fn();
    console.log(`ok - ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`not ok - ${item.name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`${tests.length} tests passed`);
}
