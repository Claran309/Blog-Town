# Handoff — Claran's Blog（小镇版）

最后更新：2026-11-19

## 工作区

- 仓库根目录：`D:\CodeStudy\GoProjects\src\AstroClaranBlog`
- 当前工作目录（Git worktree）：`D:\CodeStudy\GoProjects\src\AstroClaranBlog\town-personal`
- 分支：`personal/claran-latest`
- 远程：`https://github.com/Claran309/Blog-Town.git`
- 当前提交：`96341e3`（`fix(about): center the About layout instead of pinning the ToC to the right edge`）
- 本地与 `origin/personal/claran-latest` 已同步

> 所有 git / npm 命令都必须在 `town-personal` 目录下、用 PowerShell 执行。不要用 WSL 或 bash，这台机器上 WSL 会导致 git worktree 与中文输出异常。

## 部署

- 生产域名：`https://www.claran-blog.work/`
- 裸域 `claran-blog.work` 已 308 跳转到 `www`
- Vercel 项目：`claran-town`（`clarans-projects`）
- 生产分支：`personal/claran-latest`，push 后自动部署
- 经典版旧站：`https://classic.claran-blog.work/`（Vercel 项目 `claran-classic`，分支 `classic`）
- Twikoo 评论沿用旧站数据，文章路径按历史映射；`/about/` 留言板用 `commentPath="/about"`
- GTM `GTM-KRX3XGVH` 已验证；Clarity `tjr3vkhj8i` 仍需在后台确认

## 最近完成的工作

### 中心地标（About 风车）

- `src/scene/brick-town/features.ts` 重写为 BA 方案：两级台阶基座、5/4/4/3/3/2/3 收分塔身、红色腰环、两层灯室、阶梯屋顶与信标。
- 扇叶为像素阶梯造型：三段错位（窄—外凸—窄），红边加粗，深色边收细。
- 扇叶平面与塔身正面平行，转轴垂直伸出，不再正对镜头。
- 地标玻璃灯已纳入夜景辉光；`kit.ts` 新增 `rolledBox`（平面内旋转积木）供扇叶使用。

### 侧边栏与导航

- 「名片」→ 小镇根目录 `/`，并强制把侧边栏面板重置为简介卡（此前面板不重置导致“点了没反应”）。
- 「关于」→ `/about/`，桌面端侧栏、移动端侧栏、顶栏三处都有入口并正确高亮。
- 顺带修复了 About 页标题在导航中的历史遗留问题。

### About 页面

- 从独立整页改为应用内视图：`MainSurface` 增加 `about`，`useTownNavigation` 支持 `/about/` 路由。
- 组件 `AboutView` 在 `src/components/TownBlogApp.tsx`，使用卡片布局：标题区、头像 hero 卡（实时文章/分类/标签数量）、四张内容卡、右侧目录、留言板。
- 布局已居中：容器 `max-width: 1060px`、固定轨道 `700px + 200px`、`margin: 0 auto`。1920 宽下主栏 604–1304、目录 1360–1560，整体居中。
- 独立静态页 `src/pages/about.astro` 仍保留，供直接访问与 SEO。
- 文案已按用户要求更新：关于我（记录一切）、这座小镇（介绍小镇，不再介绍风车）、最近在做什么（底层/八股/开源/投简历找实习）、找到我（换掉“想聊什么”的说法）。

### 其他

- 侧边栏座右铭改为「即使愚蠢如我，明天也会到来」（`src/config/site.ts`）。
- About 独立页曾因 `body { overflow: hidden }` 无法滚动，已在 `src/styles/about.css` 用 `body:has(.about-page)` 恢复滚动。

## 验证

标准命令（在 `town-personal` 下）：

```powershell
npm run check
npm run build
npm run verify
```

当前状态：`npm run verify` 全绿（内容、空间、邻近、实例、生命、积木、季节、公告、布局、布局缓存、Markdown、RSS 全部通过）。构建只有一个已知的非阻塞警告：某个 JS chunk 超过 500KB。

本地预览：

```powershell
npx astro preview --port 4324 --host 127.0.0.1 --background
npx astro preview stop
```

> 注意：`npm run dev` 在这台机器上会因 `node_modules` 是指向 `D:\Temp\Blog-Town-analysis\node_modules` 的 junction，Vite 拒绝加载 React 岛。用 `build + preview` 验证。

## 已知遗留

- 工作区有大量未跟踪临时文件（截图、检查脚本）：`tmp-*.png`、`scripts/.tmp-*.mjs`、`output/`。删除命令被环境策略拦截，未提交进 Git；新会话不要把它们加入提交。
- `output/imagegen/` 中是生成概念图时的测试产物，可手动删除。
- Clarity 数据仍需在 Clarity 后台确认。

## 产品待办（详见 `docs/PRODUCT-TODO.md`）

仍待完成：

- 项目页面（ClaranCloudDisk、ClaranAIM）
- 短日记页面
- 友邻小镇聚落（友链做成特殊区域的小屋）
- 图片体验优化
- 站点累计数据（累计访问人数、文章数、字数）
- 文章阅读量
- Clarity 后台确认

## 协作约定（重要）

- 用户使用中文交流，回复保持简洁、直接。
- **涉及新功能或较大 UI 改动，必须先讨论方案、得到用户确认后再动手**；小文案/小样式修正可以直接做。
- 不要擅自创建 Plan C 相关 issue，除非用户明确要求。
- 不要提交 `tmp-*`、`scripts/.tmp-*`、`output/` 等临时产物。
- 部署流程：改完 → `npm run verify` → commit → push `personal/claran-latest` → 等 Vercel → 用 Playwright 验证生产站。

## 全局生图 Skill

路径：`C:\Users\Claran\.codex\skills\imagegen-gateway`

- 默认网关：`https://fast.qianxing.us.ci/v1`
- 默认模型：`gpt-image-2.6`
- 密钥保存在该 Skill 的 `config.json`，不要外泄或提交到仓库
- 用法：

```powershell
python "$env:USERPROFILE\.codex\skills\imagegen-gateway\scripts\generate.py" generate `
  --prompt "描述" --n 4 --out-dir output/imagegen/variants
```

## 建议的起步动作

1. 在 `town-personal` 下执行 `git status --short --branch`，确认在 `personal/claran-latest` 且与远程同步。
2. 读一遍 `docs/PRODUCT-TODO.md`，从中挑下一项产品待办。
3. 若是新功能或较大 UI 改动，先向用户确认方案再实现。
