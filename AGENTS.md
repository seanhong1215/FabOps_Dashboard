# AGENTS.md

## 專案概述

FabOps Dashboard 是一個使用 Vue 3 + TypeScript 打造的半導體廠務營運儀表板。畫面呈現即時設備健康狀態、生產 KPI、瓶頸分析、製程控制圖表與事件串流，定位為可用於面試展示的前端作品。

此專案的目標使用者是值班主管或設備工程師。UI 應協助他們快速判讀產線健康狀態，並決定下一步處置。

## 技術棧

- Vue 3 Composition API
- TypeScript strict mode
- Pinia：管理設備狀態與 demo telemetry
- Vue Router：使用 route-level lazy loading
- Naive UI：應用程式 UI 元件
- Apache ECharts + `vue-echarts`：資料視覺化
- Vite：開發伺服器與 production build

## 主要檔案

- `src/App.vue`：應用程式 shell、header、light/dark theme provider 與全站 theme variables。
- `src/views/DashboardView.vue`：主儀表板頁面組合與版面配置。
- `src/stores/equipment.ts`：Pinia store、demo 機台資料、衍生指標與 telemetry 模擬。
- `src/types/equipment.ts`：機台、KPI、log、stream、time series 等 domain type。
- `src/components/KpiCard.vue`：KPI 卡片元件。
- `src/components/MachineStatus.vue`：設備健康狀態卡片。
- `src/components/EventLog.vue`：即時事件串流。
- `src/components/*Chart.vue`：ECharts 圖表元件。
- `src/composables/useWebSocket.ts`：WebSocket adapter，包含 demo simulation fallback。
- `src/composables/useSSE.ts`：SSE event stream adapter。
- `src/router/index.ts`：route-level lazy loading。
- `vite.config.ts`：路徑 alias、dev server 與 manual chunk 策略。

## 目前 UI 結構

- Sticky header：品牌名稱、demo-data badge、theme toggle。
- Hero command center：`hero-copy` 說明區與 Fab health score panel。
- KPI 區塊：Overall OEE、Line WPH、First Pass Yield、Avg CVD Temp。
- Operations 區塊：active bottleneck 與 recommended next actions。
- Charts 區塊：CVD temperature、WPH by tool、yield split、pressure and gas flow。
- Equipment matrix：每台設備的狀態、recipe、WPH target、availability、utilization、queue、signals 與 incident。
- Incident stream：即時事件列表。

## Theme 與 UI 色彩規則

- Light/dark theme 的主控在 `src/App.vue`。
- `app-shell` 會依照狀態套用 `.app-shell--light` 或 `.app-shell--dark`。
- 共用色票使用 CSS variables，例如：
  - `--app-bg`
  - `--app-surface`
  - `--app-surface-strong`
  - `--app-surface-soft`
  - `--app-border`
  - `--app-border-strong`
  - `--app-shadow`
  - `--app-header-bg`
  - `--app-header-text`
  - `--app-hero-bg`
  - `--app-hero-text`
  - `--app-hero-muted`
  - `--app-hero-eyebrow`
  - `--app-chip-bg`
  - `--app-chip-text`
- `hero-copy` 必須跟著 theme 切換：
  - Light mode：亮色藍白背景、深色文字。
  - Dark mode：深色背景、淺色文字。
- KPI cards、machine cards、chart cards、event log 都應使用 `--app-surface*`、`--app-border*`、`--app-shadow`，不要各自硬寫不一致的背景色。
- Header 背景與文字必須使用 `--app-header-*` 變數，確保 theme toggle 後仍有足夠對比。
- Dashboard 圖表的 `isDark` 必須跟手動 theme toggle 同步，不應只依賴 OS theme。

## UI 維護原則

- 儀表板應維持資訊密度高、偏營運工具、容易掃讀。
- 優先生產訊號與決策資訊，不要做成行銷型 landing page。
- 保留目前 command center 架構：hero、KPI cards、瓶頸與行動建議、charts、equipment matrix、incident stream。
- Card 只用於重複型 widget 或需要明確框架的 dashboard module。
- 保持 desktop 與 mobile 的 responsive 行為。
- 避免過度裝飾；視覺重點應來自資料階層、圖表與狀態指標。
- 文字與背景對比要同時檢查 light mode 與 dark mode。

## 工程維護原則

- 優先沿用現有專案模式，不要過早新增抽象層。
- 設備資料異動應先更新 `src/types/equipment.ts` 的型別。
- 圖表邏輯應維持在 chart components 中。
- 即時串流整合應維持在 composables 中。
- 保留 `src/router/index.ts` 的 route-level lazy loading。
- 保留 Vite manual chunks：`vue-vendor`、`ui`、`charts`、`zrender`，除非有量測結果支持調整。
- 不要讓專案依賴後端才能展示；demo mode 必須在沒有外部服務時仍可運作。

## 常用命令

```bash
npm run dev
npm run type-check
npm run build
npm run preview
```

完成 UI 或 TypeScript 修改後，至少要執行：

```bash
npm run build
```

## 已知 Build 提醒

執行 build 時，Vite 可能會顯示 CJS Node API deprecation warning。這目前不會阻擋 production output。
