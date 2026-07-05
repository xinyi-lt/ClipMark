import { describe, expect, it } from "vitest";
import { createSelectorFromRange, findRangeFromSelector } from "../src/shared/selector";

function setBody(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body;
}

describe("text quote selector", () => {
  it("creates and restores a normal paragraph range", () => {
    const root = setBody("<main><p>Alpha beta gamma delta.</p></main>");
    const text = root.querySelector("p")!.firstChild!;
    const range = document.createRange();
    range.setStart(text, 6);
    range.setEnd(text, 16);

    const selector = createSelectorFromRange(root, range);
    const restored = findRangeFromSelector(root, selector);

    expect(selector.exact).toBe("beta gamma");
    expect(restored?.toString()).toBe("beta gamma");
  });

  it("uses prefix and suffix to choose repeated text", () => {
    const root = setBody("<p>Alpha repeat omega. Beta repeat sigma.</p>");
    const text = root.querySelector("p")!.firstChild!;
    const value = text.textContent!;
    const start = value.indexOf("repeat", value.indexOf("Beta"));
    const range = document.createRange();
    range.setStart(text, start);
    range.setEnd(text, start + "repeat".length);

    const selector = createSelectorFromRange(root, range);
    const restored = findRangeFromSelector(root, selector);

    expect(restored?.toString()).toBe("repeat");
    expect(selector.prefix).toContain("Beta ");
    expect(selector.suffix).toContain(" sigma");
  });

  it("returns null when text cannot be found", () => {
    const root = setBody("<p>Only local text.</p>");

    expect(findRangeFromSelector(root, { exact: "missing", prefix: "", suffix: "" })).toBeNull();
  });
});
