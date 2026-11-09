# Tasks：ins 风毛玻璃第一期（首页 / 聊天 / 设置）

> 依赖 spec.md。执行顺序即勾选顺序。

- [x] **T1 新建 `css/glass.css`**
  - 建立 `:root` 的 `--glass-*` 变量（blur 18px / alpha 0.65）。
  - 写入 `html[data-theme="light"]` 柔光渐变背景（珊瑚粉 / 薰衣草 / 薄荷）。
  - 写入 `body::before` 透明化（保留 `--chat-bg-image`）与 `.home-page-bg` 透明化（不加 `!important`）。
  - 验收：文件存在，所有选择器带 `html[data-theme="light"]` 前缀（变量定义除外）。

- [x] **T2 写入聊天页玻璃样式**
  - 覆盖 `.header`、`.input-area-wrapper`、`.input-area`、`.message-input`、`.message-sent`、`.message-received`、`.message-meta-actions`。
  - 验收：仅上述 2 个容器开启 blur；气泡与小层不加 blur。

- [x] **T3 写入首页玻璃样式**
  - 覆盖 `.hero-card`、`.app-item`、`.app-icon`、`.home-nav-bar`。
  - 验收：`.app-item` 有半透明底 + 白边 + 内高光，无 `backdrop-filter`。

- [x] **T4 写入设置弹窗玻璃样式**
  - 覆盖 `#settings-modal`、`#settings-modal .modal-content`、`#settings-modal .settings-card`、`#settings-modal #mj-backup-banner`。
  - 验收：备份 banner 仅改背景/边框，DOM 与按钮 id 不变，仍可见可点击。

- [x] **T5 接入 `index-zy.html`**
  - 在 `</head>` 前、`js/spark-shared.js` 之后插入 `<link rel="stylesheet" href="css/glass.css">`。
  - 验收：`glass.css` 是 head 里最后一个样式表。

- [x] **T6 升级版本号**
  - `android/app/build.gradle`：`versionCode 30`、`versionName "1.10.3"`。
  - `android/app/src/main/java/com/mengjiao/app/MainActivity.java`：`APP_VERSION = "1.10.3"`。
  - `sw.js`：`CACHE_NAME = 'mengjiao-v26'`。
  - 验收：三处 grep 结果一致。

- [x] **T7 静态自检**
  - Grep 确认：`glass.css` 引用存在；`styles.css` 未被修改（`git diff --stat` 不含它）；备份 banner 的 `mj-backup-export/import/time` 仍在 `index-zy.html`。
  - 验收：以上三条全部通过。

- [x] **T8 提交并发布**
  - 提交 `css/glass.css` + `index-zy.html` + 三处版本号；push 到 `main`。
  - 等待 GitHub Actions 完成，确认 Release 产出。
  - 验收：给出最新 Release 下载链接，并说明本期只改了首页 / 聊天 / 设置。

# 第二期任务（其余功能页，沿用同一套 token）

- [x] **T9 四个 iframe 页面接入 `glass.css`**
  - `pages/plan.html`：在 `fonts.css` 之后、`</head>` 前插入 `<link rel="stylesheet" href="../css/glass.css">`。
  - `pages/ledger.html`、`pages/sweet.html`：在模块 css 之后、`</head>` 前插入同一行。
  - `pages/spark-new.html`：在行内 `<style>` 之后、`</head>` 前插入同一行。
  - 验收：4 个文件内 `glass.css` 都是 head 里最后一个样式表。

- [x] **T10 `glass.css` 追加「主容器透明化」节**
  - `.moments-container`、`.moments-container .app-container`、`.shop-container`、`.pet-container`、`.plan-app`、`.ledger-app`、`.sweet-app`、`.app-bg` → `background: transparent`。
  - 验收：全部带 `html[data-theme="light"]` 前缀，且不带 `!important`。

- [x] **T11 `glass.css` 追加「朋友圈 + 日记 + 记账 + 商城 + 萌宠 + 火花弹窗」两节**
  - 大面板/悬浮层（开 blur）：见 spec 12.3 中对应条目。
  - 卡片（不开 blur）：见 spec 12.4 中对应条目；`.moment-card::after` 隐藏、卡片留白改 10px 12px / 13px 14px。
  - 验收：`.lg-cat-*`、`.mood-mood-*` 未被覆盖；按钮颜色未变。

- [x] **T12 `glass.css` 追加「计划 / 账本 / 甜蜜」三节**
  - 覆盖 `.plan-*`、`.ledger-*`、`.sweet-*` 的容器、贴纸卡、弹层（清单见 spec 12.3 / 12.4）。
  - 验收：`.plan-vpill.*`、`.plan-vtag.*`、`.ledger-*-amount.*` 保持原色。

- [x] **T13 升级版本号**
  - `android/app/build.gradle`：`versionCode 31`、`versionName "1.10.4"`。
  - `MainActivity.java`：`APP_VERSION = "1.10.4"`。
  - `sw.js`：`CACHE_NAME = 'mengjiao-v27'`（`./css/glass.css` 已在 precache 列表，无需新增）。
  - 验收：三处 grep 一致。

- [x] **T14 静态自检**
  - `git diff --stat` 不含 `css/styles.css` 与任何模块 CSS。
  - grep 确认 5 处 `glass.css` 引用（index-zy + 4 个 iframe 页）。
  - grep 确认 `glass.css` 中 `backdrop-filter` 只出现在容器级/悬浮层选择器。
  - 验收：以上全部通过。

- [ ] **T15 提交并发布**
  - commit + push `main`，等待 Actions 完成，取最新 Release APK 链接。
  - 验收：回复中列出本期覆盖的页面清单与 APK 链接。
