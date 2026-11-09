# Spec：ins 风毛玻璃改版（第一期：首页 / 聊天 / 设置）

## 1. 目标
为「梦角传讯」增加一层 ins 风毛玻璃视觉皮肤，第一期只覆盖 **首页、聊天页、设置弹窗** 三个界面。
验证满意后，再把同一套 token 铺到其余功能页。

## 2. 用户已确认的三项选择
| 决策项 | 选择 | 落地含义 |
| --- | --- | --- |
| 背景风格 | **A 粉紫薄荷柔光** | 珊瑚粉 / 薰衣草 / 薄荷三团大色块高斯柔光，固定铺满全屏 |
| 玻璃强度 | **B 中** | `backdrop-filter: blur(18px)`，白色底 `alpha 0.65` |
| 明暗模式 | **A 只做浅色** | 所有新样式挂在 `html[data-theme="light"]` 下；切到暗色自动全部失效，回到原样式 |
| 9 套强调色 | **保留不动** | 只引用 `--accent-color` / `--accent-color-rgb`，不修改任何主题变量 |

## 3. 实现方式（硬约束）
- **不改写** `css/styles.css` 及任何模块 CSS。
- 新增单文件 `css/glass.css`，在 `index-zy.html` 的 `</head>` 之前最后引入，保证级联顺序最后。
- 所有玻璃参数集中在 `:root` 的 `--glass-*` 变量里，改一处即可全局调强度。
- **一键回退**：删掉 `index-zy.html` 中 `<link rel="stylesheet" href="css/glass.css">` 这一行即可完全恢复原样，无需回滚其他文件。
- 安全线：不碰 `#mj-backup-banner` 的 DOM 结构、不碰 `js/home.js`、不碰懒加载逻辑、不碰主题切换逻辑。

## 4. 设计 Token
```css
:root {
  --glass-blur: 18px;                    /* B 中强度 */
  --glass-alpha: 0.65;                   /* 大面板白底 */
  --glass-alpha-soft: 0.45;              /* 小卡片白底 */
  --glass-bg: rgba(255,255,255,var(--glass-alpha));
  --glass-bg-soft: rgba(255,255,255,var(--glass-alpha-soft));
  --glass-border: rgba(255,255,255,0.60);
  --glass-stroke: rgba(255,255,255,0.90);/* 顶部 1px 亮边 */
  --glass-shadow: 0 8px 32px rgba(84,64,110,0.10), 0 2px 8px rgba(84,64,110,0.05);
  --glass-radius: 22px;
}
```
柔光背景（挂在 `html[data-theme="light"]`，`background-attachment: fixed`）：
- 珊瑚粉 `rgba(255,173,186,.55)`，约 8% / 2% 位置
- 薰衣草 `rgba(186,170,255,.50)`，约 95% / 6% 位置
- 薄荷 `rgba(160,232,205,.55)`，约 50% / 110% 位置
- 底色 `#f6f2f7`

## 5. 逐处改动清单

### 5.1 全局背景（影响三个页面的共同底色）
| 选择器 | 现状 | 改为 |
| --- | --- | --- |
| `html[data-theme="light"]` | 无背景 | 柔光渐变 + `background-attachment: fixed` |
| `html[data-theme="light"] body::before` | `background-color: var(--primary-bg)` 不透明白色 | `background-color: transparent`，保留 `background-image: var(--chat-bg-image, none)`，用户自定义聊天背景不受影响 |
| `html[data-theme="light"] .home-page-bg` | `background:#fafafa` 实色 | `background: transparent`（**不加 !important**，用户通过 js 设置的内联自定义背景仍优先） |

### 5.2 聊天页
| 选择器 | 改动 |
| --- | --- |
| `.header` | 白 `0.58` + `blur(18px) saturate(180%)` + 白色 0.55 下边框 + 内高光；`opacity: 1`（原 0.82） |
| `.input-area-wrapper` | 背景改 `rgba(255,255,255,0.60)` + `blur(18px) saturate(180%)` + 顶部 1px 白色亮边 |
| `.input-area` | `border-top-color: rgba(255,255,255,0.6)` |
| `.message-input` | 背景改 `rgba(255,255,255,0.72)`，边框白色 0.7，聚焦时边框用 accent |
| `.message-received` | 背景改 `rgba(255,255,255,0.70)` + `1px solid rgba(255,255,255,0.75)` + 内高光；**不加 blur**（列表内元素，保性能） |
| `.message-sent` | 背景改 `rgba(var(--accent-color-rgb),0.88)`，保留白字；不加 blur |
| `.message-meta-actions` | 背景改 `rgba(255,255,255,0.78)` + `blur(10px)`（悬浮小层，元素数量少） |

### 5.3 首页
| 选择器 | 改动 |
| --- | --- |
| `.hero-card` | 只统一圆角/描边/阴影为玻璃语言，不加 blur（内部有背景图，避免糊） |
| `.app-item` | 新增半透明玻璃底 `rgba(255,255,255,0.42)` + `1px` 白边 + 内高光，圆角 18px；不加 blur |
| `.app-icon` | 背景提到 `rgba(255,255,255,0.62)`，边框白色 0.8，保持既有布局尺寸不变 |
| `.home-nav-bar` | blur 30 → 18（统一强度），背景白 `0.55`，边框白色 0.55 |
| `.standalone-time` 文字 | 仅加深对比度，不加容器（保持清爽） |

### 5.4 设置弹窗（`#settings-modal`）
| 选择器 | 改动 |
| --- | --- |
| `#settings-modal`（遮罩） | `rgba(60,45,80,0.28)` + `blur(12px)` |
| `#settings-modal .modal-content` | 背景 `rgba(255,255,255,0.72)` + `blur(18px) saturate(180%)` + 白边 + 大阴影 + 圆角 26px |
| `#settings-modal .settings-card` | 背景 `rgba(255,255,255,0.50)` + 白边 + 内高光；hover 变 `0.70`；不加 blur |
| `#settings-modal #mj-backup-banner` | **仅视觉**：背景改 `rgba(255,255,255,0.55)`、加白边与内高光（用 `!important` 覆盖行内渐变），DOM 与按钮事件完全不动 |

### 5.5 性能红线
只对 **5 类** 元素开启 `backdrop-filter`：`.header`、`.input-area-wrapper`、`#settings-modal`、`#settings-modal .modal-content`、`.home-nav-bar`、`.message-meta-actions`。
列表内的小卡片（`.app-item`、`.settings-card`、消息气泡）一律用「半透明 + 1px 白边 + 内阴影」模拟玻璃，不开启 blur。

## 6. 明确不做（第一期）
- 不做暗色毛玻璃（切暗色即恢复原样式）。
- 不改朋友圈、日记、计划、萌宠、商城、地图、账单、小火人、甜蜜轨迹等其他页面。
- 不改任何业务 JS 逻辑与数据结构。
- 不改 9 套强调色主题变量。

## 7. 版本与发布
按既有发版规则，三处版本号同步升级：
| 文件 | 字段 | 现值 → 新值 |
| --- | --- | --- |
| `android/app/build.gradle` | `versionCode` / `versionName` | 29 → 30；"1.10.2" → "1.10.3" |
| `android/app/src/main/java/com/mengjiao/app/MainActivity.java` | `APP_VERSION` | "1.10.2" → "1.10.3" |
| `sw.js` | `CACHE_NAME` | `'mengjiao-v25'` → `'mengjiao-v26'` |

提交 push 到 `main`，由 GitHub Actions 自动编译并发布 Release；完成后给出 `https://github.com/xqz144/ZY/releases` 的下载入口。

## 8. 验收标准
1. `index-zy.html` 中 `glass.css` 位于全部样式之后、`</head>` 之前。
2. `glass.css` 内所有规则均以 `html[data-theme="light"]` 开头（`--glass-*` 变量与 `:root` 定义除外）。
3. 浅色下：首页可见粉紫薄荷柔光透出、功能图标为半透明玻璃块；聊天页头部/输入栏为磨砂玻璃、气泡为半透明白；设置弹窗为磨砂大面板、备份 banner 仍可点击。
4. 暗色下：三个界面与改版前完全一致（无残留玻璃）。
5. 用户若曾自定义首页背景/聊天背景，自定义背景仍生效（玻璃面板叠加其上）。
6. 版本号三处一致为 1.10.3 / 30 / mengjiao-v26。
7. Android WebView 滚动聊天记录不掉帧（目测流畅，无长时间白块）。

## 9. 回退方案
1. 删 `index-zy.html` 中 `glass.css` 的 `<link>` → 立即恢复原视觉。
2. 版本号回退并重新发版即可让用户覆盖安装。

---

# Spec：ins 风毛玻璃第二期（其余功能页）

## 10. 目标与用户确认
用户在第一期（首页 / 聊天 / 设置）给出「不错 就按这个调」的确认，第二期沿用 **完全同一套 token（A 柔光 + B 中强度玻璃 + 只做浅色 + 9 套主题不动）**，铺到其余全部功能界面，不引入任何新的设计参数。

## 11. 作用域（经代码核对后的真实结构）
### 11.1 同文档内嵌（`index-zy.html` 中，`glass.css` 已生效）
| 界面 | 主容器 | 关键卡片 / 悬浮层 |
| --- | --- | --- |
| 朋友圈 | `.moments-container`、`.moments-container .app-container` | `.moment-card`、`.mb-bar-btn`、`.moments-bottom-bar`、`.user-profile-inner`、`.moments-notification-card`、`.notification-detail-panel`、`.search-panel`、`.interaction-bubble` |
| 朝夕心记 | `.modal` + `.modal-content.diary-modal-wrapper` | `.diary-modal-header`、`.diary-panel`、`.diary-tabs`、`.diary-view-tabs`、`.diary-period-editor-overlay/.diary-period-editor-card`、`.diary-editor-overlay/.diary-editor-card`、`.mini-calendar-overlay/.mini-calendar-card/.mini-cal-detail-overlay/.mini-cal-detail-card` |
| 同心记账 | `.modal` + `.modal-content.accounting-modal-wrapper` | `.accounting-summary-bar`、`.accounting-tabs`、`.accounting-panel`、`.accounting-form-overlay/.accounting-form-popup`、`.accounting-stats-card`、`.accounting-label-card` |
| 商城 | `.shop-container` | `.shop-header`、`.shop-tabs`、`.product-card`、`.cart-item`、`.cart-footer`、`.shop-bottom-nav`、`.search-input`、`.search-dropdown`、`.shop-modal/.shop-modal-content` |
| 萌宠 | `.pet-container` | `.pet-page-nav`、`.top-bar`、`.dreamy-card`、`.pet-card`、`.input-card`、`.story-box`、`.guide-box`、`.speech-bubble`、`.dreamy-input` |
| 火花（主文档内弹窗） | `.spark-modal-overlay` | `.spark-modal`、`.spark-stat-card` |

### 11.2 iframe 独立页面（需新增引入 `glass.css`）
| 页面 | 主容器 | 关键卡片 / 悬浮层 |
| --- | --- | --- |
| `pages/plan.html` | `.plan-app` | `.plan-hero`、`.plan-subtabs`、`.plan-cal-wrap`、`.plan-focus-card`、`.plan-stats-card`、`.plan-stat-card`、`.plan-chart-card`、`.plan-profile-card`、`.plan-quad`、`.plan-qitem`、`.plan-vday-item`、`.plan-overlay`、`.plan-sheet` |
| `pages/ledger.html` | `.ledger-app` | `.ledger-hero`、`.ledger-subtabs`、`.ledger-cal-wrap`、`.ledger-day-block`、`.ledger-entry`、`.ledger-ticket`、`.ledger-overlay`、`.ledger-sheet` |
| `pages/sweet.html` | `.sweet-app` | `.sweet-hero`、`.sweet-tabs`、`.sweet-subtabs`、`.sweet-stat-card`、`.sweet-checkin-item`、`.sweet-anni-card`、`.sweet-diary-card`、`.sweet-wish-item`、`.mood-wrap`、`.sweet-overlay`、`.sweet-sheet` |
| `pages/spark-new.html` | `.app-bg` | `.stat-card`、`.form-card` |

## 12. 逐处改动清单（第二期）
### 12.1 四个 iframe 页面接入样式
在各自 head 的**最后一个样式表之后、`</head>` 之前**插入：
`<link rel="stylesheet" href="../css/glass.css">`
（`plan.html` 在 `fonts.css` 之后；`ledger.html` / `sweet.html` 在模块 css 之后；`spark-new.html` 在行内 `<style>` 之后，行号约 758 的 `</head>` 前）

### 12.2 主容器透明化（让柔光背景透出）
`.moments-container`、`.moments-container .app-container`、`.shop-container`、`.pet-container`、`.plan-app`、`.ledger-app`、`.sweet-app`、`.app-bg` 全部改 `background: transparent`（不加 `!important`，用户内联自定义背景仍优先）。

### 12.3 悬浮条 / 大面板（允许 `backdrop-filter`）
统一 `bg rgba(255,255,255,.58~.62)` + `blur(var(--glass-blur)) saturate(180%)` + 1px 白边 + 内高光：
`.moments-bottom-bar`、`.notification-detail-panel`、`.search-panel`、`.modal`（遮罩改 `rgba(60,45,80,.28)` + blur 12px）、`.modal-content.diary-modal-wrapper`、`.modal-content.accounting-modal-wrapper`、`.accounting-form-popup`、`.mini-calendar-card`、`.mini-cal-detail-card`、`.diary-period-editor-card`、`.diary-editor-card`、`.shop-header`、`.shop-bottom-nav`、`.cart-footer`、`.search-dropdown`、`.shop-modal-content`、`.pet-page-nav`、`.top-bar`、`.plan-subtabs`、`.plan-overlay`+`.plan-sheet`、`.ledger-subtabs`、`.ledger-overlay`+`.ledger-sheet`、`.sweet-tabs`、`.sweet-subtabs`、`.sweet-overlay`+`.sweet-sheet`、`.spark-modal-overlay`+`.spark-modal`。

### 12.4 卡片（不加 blur，用「半透明 + 1px 白边 + 内高光」模拟玻璃）
统一 `background: rgba(255,255,255,.45~.55)`、`border: 1px solid rgba(255,255,255,.70)`、`border-radius: 18px`、`box-shadow: 0 6px 22px rgba(84,64,110,.07), inset 0 1px 0 rgba(255,255,255,.9)`：
`.moment-card`（并 `::after` 分割线 `display:none`，`margin:10px 12px`、内边距 13px 14px 改为卡片态）、`.mb-bar-btn`、`.user-profile-inner`、`.moments-notification-card`、`.interaction-bubble`、`.diary-panel`、`.diary-tabs`/`.diary-view-tabs` 内的按钮容器、`.accounting-summary-bar`、`.accounting-stats-card`、`.accounting-label-card`、`.product-card`、`.cart-item`、`.search-input`、`.pet-card`、`.dreamy-card`、`.input-card`、`.story-box`、`.guide-box`、`.speech-bubble`、`.dreamy-input`、`.plan-hero`、`.plan-cal-wrap`、`.plan-focus-card`、`.plan-stats-card`、`.plan-stat-card`、`.plan-chart-card`、`.plan-profile-card`、`.plan-quad`、`.plan-qitem`、`.plan-vday-item`、`.ledger-hero`、`.ledger-cal-wrap`、`.ledger-day-block`、`.ledger-entry`、`.ledger-ticket`、`.sweet-hero`、`.sweet-stat-card`、`.sweet-checkin-item`、`.sweet-anni-card`、`.sweet-diary-card`、`.sweet-wish-item`、`.mood-wrap`、`.stat-card`、`.form-card`。

## 13. 明确保留（不得覆盖）
- `.lg-cat-*`、`.mood-mood-*`、`.plan-vpill.*`、`.plan-vtag.*`、`.ledger-*-amount.*` 等**语义识别色**——保持原色。
- 所有按钮（`.plan-add-btn`、`.ledger-add-btn`、`.sweet-add-btn`、`.modal-btn-*`、`.checkout-btn` 等）保持实心强调色，不玻璃化，保证点击可识别。
- 不改任何业务 JS、DOM 结构、事件 id；不改 `css/styles.css` 与各模块 CSS。
- 不加任何暗色规则；9 套强调色主题变量零改动。

## 14. 性能红线（第二期）
`backdrop-filter` 只出现在 12.3 的容器级/悬浮层选择器，数量固定；12.4 全量卡片与列表项**禁止** `backdrop-filter`。朋友圈 `.moment-card`、商城 `.product-card`、萌宠列表这类长列表一律走模拟玻璃。

## 15. 版本与验收（第二期）
| 文件 | 字段 | 现值 → 新值 |
| --- | --- | --- |
| `android/app/build.gradle` | `versionCode` / `versionName` | 30 → 31；"1.10.3" → "1.10.4" |
| `MainActivity.java` | `APP_VERSION` | "1.10.3" → "1.10.4" |
| `sw.js` | `CACHE_NAME` | `'mengjiao-v26'` → `'mengjiao-v27'` |

验收：
1. 4 个 iframe 页面 head 内 `glass.css` 均为最后一个样式表，能正常加载（`../css/glass.css`）。
2. 浅色下各页主容器透出粉紫薄荷柔光；滚动条 / 底部导航 / 弹窗为磨砂玻璃；卡片为半透明白。
3. 暗色下所有新规则失效，与改版前一致。
4. 彩色分类块与按钮颜色未被改变。
5. `git diff --stat` 不含 `css/styles.css`、不含任何模块 CSS。
6. 三处版本号一致为 1.10.4 / 31 / mengjiao-v27，Actions 构建通过并产出 Release。

## 16. 第二期回退
删除 `index-zy.html` 与 4 个 iframe 页面对 `glass.css` 的 `<link>` 即可全部恢复；其余文件零改动。
