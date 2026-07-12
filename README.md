# ClipMark

[English](#english) | [中文](#中文)

---

## English

ClipMark is a local-first Chrome / Edge Manifest V3 extension for web highlights, per-highlight notes, and Markdown / plain-text export.

It is designed for personal reading and clipping: highlight text on a web page, add notes, then copy or export everything from the current page without creating an account or sending data to a server.

### Features

- Highlight selected text on regular web pages.
- Add and edit a note for each highlight.
- Auto-save note changes while editing in the popup.
- Show a small low-distraction selection trigger instead of opening a large toolbar immediately.
- Expand the toolbar only after clicking the ClipMark trigger.
- Copy selected text directly from the floating toolbar.
- View all highlights and notes for the current page in the popup.
- Copy current page highlights and notes as Markdown.
- Copy current page highlights and notes as readable plain text.
- Export current page highlights and notes as a `.md` file.
- Configure highlight color and selection trigger behavior in Options.
- Support light and dark browser UI appearance.
- Store data locally with `chrome.storage.local`; no account, cloud sync, analytics, or tracking.

### How To Use

1. Build and load the extension from `dist/` in Chrome or Edge developer mode.
2. Open any regular web page.
3. Select text on the page.
4. Click the small ClipMark trigger near the selection.
5. Choose a highlight color from the toolbar, or copy the selected text directly.
6. Alternatively, right-click selected text and choose `Highlight with ClipMark` to save it with the default color.
7. Click a saved highlight on the page to edit or delete it.
8. Click the ClipMark extension icon to open the popup.
9. Edit notes, copy Markdown, copy plain text, or export a `.md` file from the popup.

### Selection Trigger

ClipMark uses a quiet selection trigger by default. Selecting text only shows a compact ClipMark chip. The color toolbar appears only after you click the chip, which keeps ClipMark from competing with other extensions that also react to text selection.

You can change this in Options:

- `Show small trigger`: show the compact trigger after selecting text.
- `Context menu only`: do not show selection UI; right-click selected text and choose `Highlight with ClipMark`.

### Export Formats

Markdown export format:

```md
# Page Title

Source: https://example.com
Exported: 2026-07-07 12:00

## Highlights

> Highlighted text

Note: Your note

---
```

Plain-text copy separates highlights and notes clearly:

```txt
Page Title
Source: https://example.com

Highlight: Highlighted text
Note: Your note

---
```

### Local Data And Privacy

ClipMark stores highlights, notes, page titles, URLs, and selectors in the local browser extension storage. Data is not uploaded by the extension.

Removing the extension or clearing its extension storage will remove local ClipMark data from that browser profile.

### Development

```powershell
npm install
npm run typecheck
npm run test
npm run build
```

After `npm run build`, load the `dist/` directory from Chrome or Edge extension developer mode.

### Current Scope

ClipMark v0.1 intentionally does not include accounts, cloud sync, social annotation, AI summaries, PDF support, cross-browser packaging, or Chrome Web Store publishing automation.

### License

MIT

---

## 中文

ClipMark 是一个本地优先的 Chrome / Edge Manifest V3 浏览器扩展，用于网页高亮、逐条备注，以及 Markdown / 普通文本复制和导出。

它的定位是个人阅读摘录工具：在网页上选中文字、添加备注，然后把当前页面的高亮和备注复制或导出，不需要账号，也不会把数据上传到服务器。

### 功能

- 在普通网页上高亮选中的文字。
- 给每条高亮添加和编辑备注。
- 在插件弹窗中编辑备注时自动保存。
- 选中文字后只显示低干扰的小触发器，不立即弹出大工具条。
- 点击 ClipMark 小触发器后再展开高亮工具条。
- 可在浮动工具条中直接复制当前选中文字。
- 在插件弹窗中查看当前页面的全部高亮和备注。
- 将当前页面的高亮和备注复制为 Markdown。
- 将当前页面的高亮和备注复制为普通文本，并明确区分高亮内容和备注。
- 将当前页面的高亮和备注导出为 `.md` 文件。
- 可在设置页配置高亮颜色和选区触发方式。
- 适配浅色和深色浏览器界面。
- 默认使用 `chrome.storage.local` 本地保存数据；不需要账号，不做云同步、统计分析或追踪。

### 使用方式

1. 执行构建后，在 Chrome 或 Edge 扩展开发者模式中加载 `dist/` 目录。
2. 打开任意普通网页。
3. 在页面中选中文字。
4. 点击选区旁边出现的 ClipMark 小触发器。
5. 在工具条中选择高亮颜色，或直接复制选中的文字。
6. 也可以右键点击选中的文字，选择 `使用 ClipMark 高亮`，按默认颜色直接保存。
7. 点击页面中已有的高亮，可以编辑备注或删除该条高亮。
8. 点击浏览器工具栏中的 ClipMark 图标，打开插件弹窗。
9. 在弹窗中编辑备注、复制 Markdown、复制普通文本，或导出 `.md` 文件。

### 选区触发方式

ClipMark 默认使用低干扰的小触发器。选中文字后只出现一个紧凑的 ClipMark 入口，只有点击它才会展开颜色工具条。这样可以减少和其他“选中文字就弹框”的插件互相遮挡。

你可以在设置页切换：

- `显示小触发器`：选中文字后显示紧凑触发器。
- `仅右键菜单`：不显示选区浮层，选中文字后通过右键菜单创建高亮。

### 导出格式

Markdown 导出格式：

```md
# 页面标题

Source: https://example.com
Exported: 2026-07-07 12:00

## Highlights

> 高亮内容

Note: 你的备注

---
```

普通文本复制会明确区分高亮和备注：

```txt
页面标题
Source: https://example.com

高亮：高亮内容
备注：你的备注

---
```

### 本地数据与隐私

ClipMark 会把高亮、备注、页面标题、URL 和定位选择器保存在浏览器扩展的本地存储中。扩展不会上传这些数据。

卸载扩展或清理该扩展的本地存储，会删除当前浏览器配置中的 ClipMark 本地数据。

### 开发

```powershell
npm install
npm run typecheck
npm run test
npm run build
```

执行 `npm run build` 后，在 Chrome 或 Edge 的扩展开发者模式中加载 `dist/` 目录。

### 当前范围

ClipMark v0.1 暂不包含账号、云同步、社交标注、AI 总结、PDF 支持、跨浏览器打包，也不包含 Chrome Web Store 自动发布流程。

### 协议

MIT
