export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export type TextQuoteSelector = {
  exact: string;
  prefix: string;
  suffix: string;
  startOffset?: number;
  endOffset?: number;
};

export type Highlight = {
  id: string;
  text: string;
  note: string;
  color: HighlightColor;
  createdAt: string;
  updatedAt: string;
  selector: TextQuoteSelector;
  order: number;
  isOrphaned?: boolean;
};

export type PageHighlightDoc = {
  url: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  highlights: Highlight[];
};

export type UserSettings = {
  defaultColor: HighlightColor;
  fileNameTemplate: string;
};

export type ContentMessage =
  | { type: "HLP_REFRESH" }
  | { type: "HLP_GET_PAGE_STATE" };

export type ContentResponse =
  | { ok: true; doc: PageHighlightDoc | null }
  | { ok: false; error: string };
