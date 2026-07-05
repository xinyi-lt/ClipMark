# ClipMark

[English](#english) | [中文](#中文)

---

## English

ClipMark is a local-first Chrome / Edge Manifest V3 extension for web highlights, per-highlight notes, and Markdown export.

### Features

- Highlight selected text on regular web pages.
- Add or edit a note for each highlight.
- View all highlights for the current page in the popup.
- Copy current page highlights and notes as Markdown.
- Export current page highlights and notes as a `.md` file.
- Store data locally with `chrome.storage.local`; no account, cloud sync, analytics, or tracking.

### Development

```powershell
npm install
npm run typecheck
npm run test
npm run build
```

After `npm run build`, load the `dist/` directory from Chrome or Edge extension developer mode.

### Current Scope

ClipMark v0.1 intentionally does not include accounts, cloud sync, social annotation, AI summary, PDF support, cross-browser packaging, or public store publishing.

### License

MIT

---

## 中文

ClipMark 是一个本地优先的 Chrome / Edge Manifest V3 浏览器扩展，用于网页高亮、逐条备注和 Markdown 导出。

### 功能

- 在普通网页上高亮选中的文字。
- 给每条高亮添加或编辑备注。
- 在 popup 中查看当前页面的全部高亮。
- 将当前页面的高亮和备注复制为 Markdown。
- 将当前页面的高亮和备注导出为 `.md` 文件。
- 默认使用 `chrome.storage.local` 本地保存数据；不需要账号，不做云同步、分析统计或追踪。

### 开发

```powershell
npm install
npm run typecheck
npm run test
npm run build
```

执行 `npm run build` 后，在 Chrome 或 Edge 的扩展开发者模式中加载 `dist/` 目录。

### 当前范围

ClipMark v0.1 暂不包含账号、云同步、社交标注、AI 总结、PDF 支持、跨浏览器打包和应用商店发布。

### 协议

MIT