# Handoff — Claran's Blog（小镇版）

最后更新：2026-11-19

## 工作区

- 仓库根目录：`D:\CodeStudy\GoProjects\src\AstroClaranBlog`
- 当前工作目录（Git worktree）：`D:\CodeStudy\GoProjects\src\AstroClaranBlog\town-personal`
- 分支：`personal/claran-latest`
- 远程：`https://github.com/Claran309/Blog-Town.git`
- 生产域名：`https://www.claran-blog.work/`

> 所有 git / npm 命令都必须在 `town-personal` 目录下、用 PowerShell 执行。不要用 WSL 或 bash，这台机器上 WSL 会导致 git worktree 与中文输出异常。

## 部署

- 生产分支：`personal/claran-latest`，push 后 Vercel 自动部署（项目 `claran-town`）。
- 裸域 `claran-blog.work` 308 跳转到 `www`。
- 经典版旧站：`https://classic.claran-blog.work/`（Vercel 项目 `claran-classic`，分支 `classic`）。
- Twikoo 评论沿用旧站数据，`/about/` 留言板用 `commentPath="/about"`。
- GTM `GTM-KRX3XGVH` 已验证；Clarity `tjr3vkhj8i` 仍需在后台确认。

## 本轮完成（2026-11-19）

### 阶段 0：地标与地块

- `TownFeatureKind` 扩展为 `'about' | 'diary'`，`buildFeature` 按 kind 分发。
- 新增 `TownHamlet` / `TownFriendHut` 数据模型与 `createTownHamlet()`。
- 布局器接收友邻列表，预留地块时避让地标与友邻小屋；若地标压到文章建筑会直接抛错，防止静默丢楼。

### 阶段 1：累计数据与阅读量

- `src/lib/site-stats.ts`：构建期计算文章数、累计字数、运行天数（`siteConfig.launchDate`）。
- `api/views.ts`：Vercel Function + Upstash Redis，`POST` 自增、`GET` 批量读取、`?totals=1` 读全站合计。
- 同 IP + 路径 30 分钟去重；未配置 Upstash 时返回 `enabled: false`，前端显示「—」。
- 文章页 meta 显示「N 次阅读」，切换文章时丢弃过期响应。
- 只在生产域名上报，本地与预览不上报。

### 阶段 2：短日记

- 数据：`src/data/town-diary.ts`（旧站 9 条已迁入，配图压缩为 webp，位于 `public/assets/diary/`）。
- 页面：`/diary/`，按月分组的便签卡片，含日期、地点、心情、可选配图。
- 场景：主城区东南外侧新增「短日记区域」，**每条短日记一块公告栏**，与文章建筑一样一栋一内容。
- 悬停公告栏浮出名片（日期、心情、正文、打开入口），点击跳到 `/diary/#<entry-id>` 并高亮对应卡片。
- `vercel.json` 中 `/diary` 指向经典版的三条跳转已移除。

### 浮标修复

- 右侧边缘的浮标会溢出视口：新增 `is-flipped` 自动翻转（文章、地标、友邻、日记四种浮标都覆盖）。
- 友邻小屋悬停原本不出名片，只有选中后才显示：现在悬停即预览，选中后钉住。

### 阶段 3：友邻聚落

- 主城区东南外侧新增聚落：9 间小屋沿弧线排开，一条土路接入，外圈有矮桩。
- 侧栏友邻列表改为「选择」+「访问」两个动作；选中后镜头缓动平移、小屋高亮、上方浮出名片，列表保持展开。
- 小屋不计入文章建筑、系列楼层与文章数量。

## 验证

```powershell
npm run verify
```

当前状态：全部通过（内容、空间、邻近、实例、生命、积木、季节、公告、布局、布局缓存、Markdown、RSS）。

本地预览：

```powershell
npx astro preview --port 4324 --host 127.0.0.1
npx astro preview stop
```

> `npm run dev` 在这台机器上不可用（`node_modules` 是指向 `D:\Temp\Blog-Town-analysis\node_modules` 的 junction，Vite 拒绝加载 React 岛）。用 `build + preview` 验证。

### 生产域名本地验证

`astro.config.mjs` 已放行 `claran-blog.work` 与 `www.claran-blog.work` 作为 preview host，可用
`--host-resolver-rules=MAP www.claran-blog.work 127.0.0.1` 启动 Chrome，并用 `page.route` 拦截 `/api/views` 来验证计数链路。

### 统计口径

- `wordCount` 与经典站 `SiteStats.astro` 使用同一算法：先剔除 fenced code block 与行内代码，再统计 CJK 字符 + 非 CJK 词。改算法会让新旧站数字对不上，动之前先跑对比。
- `siteConfig.launchDate` 为 `2025-10-12`，继承经典站建站日，所以运行天数跨域名连续。
- 当前累计字数 112,450，与经典站一致。

## 统计后端（已配置）

- Vercel Marketplace 已安装 Upstash for Redis，资源名 `claran-town-kv`，连接 Production + Preview。
- 环境变量由 Vercel 自动注入为 `KV_REST_API_URL` / `KV_REST_API_TOKEN`；`api/views.ts` 同时兼容 `UPSTASH_REDIS_REST_*` 命名。
- 已验证：preview 部署的 `/api/views` 可读写，30 分钟去重、非法路径 400、非法方法 405 均正常。
- 全站计数已写入历史基线：**26,000 浏览量 / 7,200 访问人数**（按经典站 2025-10-12 起的 GTM 流量估算，非实测值）。单篇阅读量从上线当天开始累计。

## 上线前需要你处理

1. 在 Clarity 后台确认 `tjr3vkhj8i` 有数据。
2. 若要修正历史基线，直接改 Redis 的 `views:site:pageviews` 与 `views:site:visitors`。

## 已知遗留

- `tmp-*.png`、`scripts/.tmp-*.mjs`、`output/` 已加入 `.gitignore`，不要提交。
- 阅读量从接入当天开始计数，不继承经典站历史数据。
- 项目页面（ClaranCloudDisk / ClaranAIM）仍未做。
- 图片体验优化只做了 `loading="lazy"` + 尺寸声明，尚未接 Astro 图片管线。

## 协作约定（重要）

- 用户使用中文交流，回复保持简洁、直接。
- **涉及新功能或较大 UI 改动，必须先讨论方案、得到用户确认后再动手**；小文案/小样式修正可以直接做。
- 不要提交 `tmp-*`、`scripts/.tmp-*`、`output/` 等临时产物。
- 部署流程：改完 → `npm run verify` → commit → push `personal/claran-latest` → 等 Vercel → 用 Playwright 验证生产站。
