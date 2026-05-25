# AGENTS.md

## 專案概述

FabOps Dashboard 是一個使用 Vue 3 + TypeScript 打造的半導體智慧製造營運平台。畫面呈現即時設備健康狀態、生產 KPI、瓶頸分析、製程控制圖表、廠區 Digital Twin、告警中心、營運分析報表與 AI 異常偵測，定位為可用於面試展示的企業級前端作品。

目標使用者是值班主管、設備工程師或製程值班人員。UI 應協助他們快速判讀產線健康狀態、設備瓶頸、異常優先級、AI 風險分數、營運趨勢與下一步處置。

## 技術棧

- Vue 3 Composition API
- TypeScript strict mode
- Pinia：管理設備狀態、realtime status 與 demo telemetry
- Vue Router：使用 route-level lazy loading
- Naive UI：應用程式 UI 元件
- Apache ECharts + `vue-echarts`：資料視覺化
- Vite：開發伺服器與 production build

## 主要檔案

- `src/App.vue`：應用程式 shell、header 導覽、light/dark theme provider 與全站 theme variables。
- `src/views/DashboardView.vue`：主儀表板頁面，包含 hero、即時串流健康狀態、KPI、瓶頸、行動建議、charts、equipment matrix 與事件串流。
- `src/views/FactoryMapView.vue`：廠區 Digital Twin / Factory Map，包含生產流程、站點風險、設備位置與設備詳情 panel。
- `src/views/AlarmCenterView.vue`：告警中心，包含告警 KPI、篩選搜尋、即時告警清單、事件時間線與處置建議。
- `src/views/AnalyticsView.vue`：營運分析與產能報表，包含 OEE / WPH 趨勢、良率損失、停機 Pareto、設備排名與班報摘要。
- `src/views/AiInsightsView.vue`：AI 洞察頁，包含 anomaly score、RUL、模型信心值、異常貢獻因子、預測維修佇列與面試展示敘事。
- `src/stores/equipment.ts`：Pinia store、demo 機台資料、衍生指標、realtime 狀態與 telemetry 模擬。
- `src/types/equipment.ts`：機台、KPI、log、stream、time series、WebSocket 狀態等 domain type。
- `src/components/KpiCard.vue`：KPI 卡片元件。
- `src/components/MachineStatus.vue`：設備健康狀態卡片。
- `src/components/EventLog.vue`：即時事件串流。
- `src/components/*Chart.vue`：ECharts 圖表元件。
- `src/composables/useWebSocket.ts`：WebSocket adapter，包含 demo simulation fallback、heartbeat、latency 計算與 auto reconnect 狀態。
- `src/composables/useSSE.ts`：SSE event stream adapter。
- `src/router/index.ts`：route-level lazy loading。
- `vite.config.ts`：路徑 alias、dev server 與 manual chunk 策略。

## 目前 UI 結構

- Sticky header：品牌名稱、展示資料 badge、theme toggle、頁面導覽。
- 即時總覽 `/`：Fab command center、realtime system 狀態面板、KPI cards、瓶頸與行動建議、charts、設備健康矩陣、事件串流。
- 廠區地圖 `/factory-map`：Digital Twin hero、生產流程、區域設備地圖、選取設備詳情、異常高亮。
- 告警中心 `/alarms`：告警統計、搜尋與篩選、告警列表、事件時間線、處置建議。
- 營運分析 `/analytics`：報表區間切換、OEE / WPH 趨勢、良率損失拆解、停機 Pareto、設備排名、班報摘要。
- AI 洞察 `/ai-insights`：AI 風險總覽、設備異常分數排序、RUL、異常貢獻因子、預測維修佇列、展示敘事。

## Theme 與 UI 色彩規則

- Light/dark theme 的主控在 `src/App.vue`。
- `app-shell` 會依狀態套用 `.app-shell--light` 或 `.app-shell--dark`。
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
- Header 背景與文字必須使用 `--app-header-*` 變數，確保 theme toggle 後仍有足夠對比。
- Dashboard、Digital Twin、Alarm Center、Analytics 與 AI Insights 都應使用 `--app-surface*`、`--app-border*`、`--app-shadow`。
- Dashboard 圖表的 `isDark` 必須跟手動 theme toggle 同步，不應只依賴 OS theme。

## UI 維護原則

- 儀表板應維持資訊密度高、偏營運工具、容易掃讀。
- 優先生產訊號、異常處置、AI 風險判讀、營運趨勢與決策資訊，不要做成行銷型 landing page。
- 介面文字以中文化或現場實務用語為主；保留必要英文縮寫，例如 Fab、Tool、OEE、WPH、WIP、Recipe、Dispatch、RUL。
- Card 只用於重複型 widget 或需要明確框架的 dashboard module。
- 保持 desktop、tablet 與 mobile 的 responsive 行為。
- 避免過度裝飾；視覺重點應來自資料階層、圖表、狀態指標、告警優先級、AI 風險與營運摘要。
- 文字與背景對比要同時檢查 light mode 與 dark mode。

## 工程維護原則

- 優先沿用現有專案模式，不要過早新增抽象層。
- 設備資料異動應先更新 `src/types/equipment.ts` 的型別。
- 圖表邏輯應維持在 chart components 中；若只是報表式摘要，可在 view 內以 CSS 視覺化。
- AI Insights 目前是 rule-based demo，不應引入後端或 ML runtime；其目標是面試展示智慧製造決策層。
- 即時串流整合應維持在 composables 中；連線狀態、mode、heartbeat、latency、reconnect attempts 應集中由 `src/stores/equipment.ts` 暴露給 UI。
- `useWebSocket.ts` 的 demo mode 必須持續可用，沒有外部 WebSocket server 時仍要能展示 heartbeat 與 latency。
- 保留 `src/router/index.ts` 的 route-level lazy loading。
- 保留 Vite manual chunks：`vue-vendor`、`ui`、`charts`、`zrender`，除非有量測結果支持調整。
- 不要讓專案依賴後端才能展示；demo mode 必須在沒有外部服務時仍可運作。
- 完成 UI 或 TypeScript 修改後，至少執行 `npm run build`。
- 每完成一個階段功能後，必須更新 `AGENTS.md`，commit 說明本階段完成內容，並推送到 `origin/main`。

## 階段紀錄

- `feat: 建立 FabOps 監控儀表板`：建立 Vue 3 + TypeScript dashboard、demo telemetry、charts、Digital Twin 與 Alarm Center 初版。
- `docs: 更新專案協作指引`：重建可讀的專案協作規範。
- `feat: 新增營運分析頁`：新增 `/analytics` 營運分析頁、header 導覽項、報表 KPI、OEE / WPH 趨勢、良率損失、停機 Pareto、設備排名與班報摘要。
- `feat: 強化即時串流狀態監控`：新增 stream mode、ready state、heartbeat status、latency、reconnect attempts、last heartbeat，並在 Dashboard 顯示即時串流健康狀態。
- 本階段：新增 `/ai-insights` AI 洞察頁，將作品從監控 dashboard 提升為智慧製造平台，展示 anomaly score、RUL、異常貢獻因子、預測維修與面試敘事。

## 常用命令

```bash
npm run dev
npm run type-check
npm run build
npm run preview
```

## 已知 Build 提醒

執行 build 時，Vite 可能會顯示 CJS Node API deprecation warning；較新版 Vite / Rolldown 也可能顯示 plugin timing 或 chunk size warning。這些目前不會阻擋 production output；若要處理，優先檢查 `charts` chunk 與圖表套件切分策略。
