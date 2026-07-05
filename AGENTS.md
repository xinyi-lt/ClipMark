# ClipMark 工作规范

## 项目定位

ClipMark 是一个 Chrome / Edge Manifest V3 浏览器高亮插件。第一版只做本地个人摘录：网页文字高亮、每条高亮添加注释、复制当前页 Markdown、导出当前页 Markdown 文件。

不做账号、云同步、社交协作、AI 总结、PDF、跨浏览器适配和应用商店发布。

## 目录结构

- `src/content/`：content script，负责网页选区捕获、高亮渲染、注释编辑浮层。
- `src/background/`：MV3 service worker，负责右键菜单、下载等浏览器后台能力。
- `src/popup/`：popup React 应用，负责当前页高亮列表、注释编辑、复制和导出。
- `src/options/`：options React 应用，负责颜色、Markdown 模板、导出文件名规则等配置。
- `src/shared/`：共享类型、storage、Markdown、URL、selector 工具。
- `tests/`：单元测试。
- `docs/`：调研、产品说明、后续路线。
- `public/`：浏览器扩展静态文件，例如 `manifest.json`。

## 命名约定

- TypeScript 文件使用 `kebab-case.ts` 或 `index.ts`。
- React 组件文件使用 `PascalCase.tsx`。
- 类型命名使用 `PascalCase`，函数和变量使用 `camelCase`。
- storage key 必须集中在 `src/shared/storage.ts` 管理。
- 用户可见英文文案集中在对应 UI 文件内，后续若要多语言化再拆分。

## 数据与隐私

- 默认只使用 `chrome.storage.local`。
- 不上传网页内容、高亮文本、注释、URL。
- 不引入远程分析、埋点、日志上报。
- 不把密钥、token、密码写入代码、commit 或日志。

## 红线

以下操作必须先问 项目维护者：

- 删除文件、目录或 git 历史。
- 修改 `.env`、密钥、token、CI/CD 配置。
- 数据库 schema 变更或数据迁移。
- `git push`、`git rebase`、`git reset --hard`、强制推送。
- 安装新的全局依赖或修改系统配置。
- 公开发布，包括 Chrome Web Store 发布、npm publish、部署生产环境、发文章。

## 验证命令

改完代码后主动运行：

```powershell
npm run typecheck
npm run test
npm run build
```

若验证失败，先查根因，不允许用注释代码或跳过错误的方式让验证通过。
