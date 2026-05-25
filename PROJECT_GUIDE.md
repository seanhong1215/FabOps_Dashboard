# FabOps Dashboard Project Guide

本文件是目前專案最新整合指南，面向開發者與作品展示準備。README 保持精簡對外說明；AGENTS 則只保留 coding agent 協作規則。

## 作品定位

FabOps Dashboard 是一個半導體智慧製造營運平台，用 Vue 3 + TypeScript 建置，展示從現場監控到營運決策的完整前端能力。

此作品對外展示時應被描述為：

```text
一個可在沒有後端依賴下展示的智慧製造平台，整合即時設備監控、Digital Twin、告警中心、營運分析與 AI 風險判讀。
```

## 核心使用情境

- 值班主管快速確認 Fab health、OEE、WPH、Yield 與目前瓶頸。
- 設備工程師從告警與設備矩陣判斷異常優先級。
- 製程值班人員觀察溫度、流量、壓力、良率等趨勢。
- 管理者查看營運分析、停機 Pareto、設備排名與班報摘要。
- 評審或技術主管可看到前端架構、資料建模、即時串流、視覺化與 UI 設計能力。

## 目前完成頁面

| 頁面 | Route | 核心內容 |
| --- | --- | --- |
| 即時總覽 | `/` | Fab command center、realtime stream health、KPI、瓶頸、行動建議、charts、設備矩陣、事件串流 |
| 廠區地圖 | `/factory-map` | Digital Twin、生產流程、站點風險、設備位置、設備詳情 panel |
| 告警中心 | `/alarms` | 告警 KPI、搜尋篩選、即時告警清單、事件時間線、處置建議 |
| 營運分析 | `/analytics` | OEE / WPH 趨勢、良率損失、停機 Pareto、設備排名、班報摘要 |
| AI 洞察 | `/ai-insights` | anomaly score、RUL、模型信心值、異常貢獻因子、預測維修佇列 |

## 技術架構

```text
src/
  components/        KPI cards, machine cards, event log, chart widgets
  composables/       WebSocket and SSE stream adapters
  router/            Lazy-loaded route definitions
  stores/            Pinia equipment store and demo telemetry simulation
  types/             Machine, KPI, log, stream, realtime status contracts
  utils/             Formatting and machine status helpers
  views/             Dashboard, Factory Map, Alarms, Analytics, AI Insights
  App.vue            App shell, navigation, theme control
  main.ts            Vue app bootstrap
```

## 資料流設計

```text
Machine Sensor / PLC / Tool Telemetry
        |
        v
MQTT / OPC UA / Modbus Gateway
        |
        v
Node.js WebSocket / SSE Gateway
        |
        v
Vue 3 Frontend
        |
        +-- Pinia equipment store
        +-- WebSocket composable with demo fallback
        +-- ECharts visualization
        +-- Naive UI enterprise interface
```

目前專案以前端 demo mode 展示為主。`useWebSocket.ts` 在沒有 WebSocket server 時仍會模擬 heartbeat、latency 與 telemetry 更新，確保作品可獨立展示。

## 技術亮點

- Route-level lazy loading：各頁面以 lazy route 載入，符合企業級前端切分習慣。
- Pinia domain store：集中管理設備狀態、KPI、series、logs 與 realtime status。
- WebSocket adapter：封裝 demo fallback、heartbeat、latency、reconnect attempts。
- ECharts components：圖表邏輯維持在 chart components 中，避免 view 過度膨脹。
- Enterprise UI：以 Naive UI、CSS variables、light/dark theme 與 dashboard layout 呈現實務工具感。
- Vite manual chunks：保留 `vue-vendor`、`ui`、`charts`、`zrender` 分包策略。

## 作品展示順序

1. 從即時總覽說明平台目標：值班主管要在 30 秒內知道 Fab 是否健康、瓶頸在哪、下一步做什麼。
2. 展示 realtime stream health：說明 demo fallback、heartbeat、latency、reconnect attempts，不依賴後端也能展示即時系統設計。
3. 切到 Factory Map：說明 Digital Twin 如何把設備、站點、WIP queue 與風險視覺化。
4. 切到 AI Insights：說明 anomaly score、RUL、貢獻因子與預測維修佇列如何支援決策。
5. 切到 Alarm Center：說明告警分級、搜尋篩選、事件時間線與處置建議。
6. 切到 Analytics：說明 OEE / WPH、良率損失、停機 Pareto 與班報如何支援管理視角。
7. 最後補充工程設計：Vue 3、TypeScript、Pinia、route lazy loading、ECharts、Vite chunks 與 GitHub Pages 部署。

## GitHub Pages 部署

目前使用 `gh-pages` 分支部署，不使用 GitHub CLI。

```powershell
npm run deploy
```

`npm run deploy` 會設定 `GITHUB_PAGES=true`、執行 production build、建立 `.nojekyll`，再透過 `gh-pages` 套件將 `dist` 推送到 `gh-pages` 分支。

手動部署流程如下：

```powershell
$env:GITHUB_PAGES='true'
npm run build
New-Item -ItemType File -Path dist/.nojekyll -Force

cd dist
git init
git checkout -b gh-pages
git add .
git commit -m "deploy: GitHub Pages"
git remote add origin git@github.com:seanhong1215/FabOps_Dashboard.git
git push -f origin gh-pages
```

Vite base path：

```ts
base: process.env.GITHUB_PAGES || process.env.GITHUB_ACTIONS ? '/FabOps_Dashboard/' : '/'
```

GitHub Pages 設定：

```text
Settings -> Pages -> Build and deployment -> Deploy from a branch -> gh-pages / root
```

## 截圖建議

建議補齊以下截圖，README 或作品簡報可直接引用：

| 截圖 | 建議檔名 | 說明 |
| --- | --- | --- |
| 即時總覽 | `docs/screenshots/dashboard.png` | Fab health、KPI、串流健康、瓶頸與事件 |
| 廠區地圖 | `docs/screenshots/factory-map.png` | Digital Twin、站點風險與設備詳情 |
| 告警中心 | `docs/screenshots/alarms.png` | 告警列表、篩選與事件時間線 |
| 營運分析 | `docs/screenshots/analytics.png` | OEE / WPH、良率損失、停機 Pareto |
| AI 洞察 | `docs/screenshots/ai-insights.png` | anomaly score、RUL、貢獻因子與維修佇列 |

## 後續優化優先順序

1. 補齊真實截圖與展示 GIF，強化 GitHub README 的第一印象。
2. 增加 loading / empty / error 狀態，讓企業級 UI 更完整。
3. 增加 mock WebSocket server 或 SSE demo script，讓即時資料流更接近實務。
4. 將 rule-based AI 拆成可替換 service，未來可接 ML inference API。
5. 補 ESLint / Prettier / Vitest，提升工程可信度。
6. 加入權限與角色視角，例如主管、設備工程師、製程工程師。
7. 針對 mobile / tablet 做展示截圖與細節微調。
