# FabOps Dashboard

半導體智慧製造營運平台 / Smart Manufacturing Operations Platform

FabOps Dashboard 是一個以 **中科半導體廠務與設備營運情境** 為核心設計的 Vue 3 前端作品。它不是一般靜態 dashboard，而是模擬值班主管與設備工程師在 Fab 現場會使用的營運系統：即時監控、廠區 Digital Twin、告警處置、營運分析與 AI 風險洞察。

> 作品目標：在面試時展現 Vue 3 + TypeScript 工程能力、即時資料流設計、工業場景 UI/UX、智慧製造 domain 理解，以及可展示的企業級前端完成度。

## Live Demo

GitHub Pages：

```text
https://seanhong1215.github.io/FabOps_Dashboard/
```

本專案支援 demo mode，不需要後端服務也能展示即時 telemetry、告警、圖表與 AI 風險分析。

## 面試展示重點

1. **即時營運監控**
   - Fab health score
   - OEE / WPH / Yield / CVD temperature
   - WebSocket stream mode、heartbeat、latency、reconnect attempts

2. **廠區 Digital Twin**
   - 生產流程站點
   - 區域設備地圖
   - 異常設備高亮
   - 點選設備查看健康狀態與處置建議

3. **告警中心**
   - 高 / 中 / 低優先級
   - 未處理 / 已確認狀態
   - 搜尋與篩選
   - 告警時間線與建議處置

4. **營運分析**
   - 日報 / 週報 / 月報切換
   - OEE / WPH 趨勢
   - 良率損失拆解
   - 停機 Pareto
   - 設備稼動與產出排名

5. **AI 智慧洞察**
   - Anomaly score
   - RUL 剩餘可用壽命
   - 異常貢獻因子
   - 預測維修佇列
   - 面試敘事：即時監控 → AI 分析 → 現場處置 → 營運回顧

## 頁面截圖說明

> 截圖建議尺寸：Desktop 1440px 以上，並至少補一張 mobile 或 tablet 視圖。正式投遞履歷時，建議將截圖放在 `docs/screenshots/` 並更新下列表格圖片路徑。

| 頁面 | 路徑 | 展示重點 | 建議截圖 |
| --- | --- | --- | --- |
| 即時總覽 | `/` | Fab health、KPI、即時串流狀態、瓶頸設備、圖表與設備矩陣 | `docs/screenshots/dashboard.png` |
| 廠區地圖 | `/factory-map` | Digital Twin、生產流程、設備位置、異常高亮、設備詳情 | `docs/screenshots/factory-map.png` |
| 告警中心 | `/alarms` | 告警優先級、搜尋篩選、時間線、處置建議 | `docs/screenshots/alarms.png` |
| 營運分析 | `/analytics` | OEE / WPH 趨勢、良率損失、停機 Pareto、班報摘要 | `docs/screenshots/analytics.png` |
| AI 洞察 | `/ai-insights` | anomaly score、RUL、預測維修、異常貢獻因子 | `docs/screenshots/ai-insights.png` |

## 系統架構

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

目前專案是前端 demo-first 設計。`useWebSocket()` 在沒有傳入 URL 時會啟動 in-browser telemetry simulation，確保沒有後端服務也能完整展示。

## 使用者情境

目標使用者是：

- 值班主管：快速判讀 Fab health、瓶頸與告警優先級。
- 設備工程師：查看 tool status、downtime、queue impact 與維修建議。
- 製程值班人員：觀察 CVD 溫度、壓力、氣體流量與 yield drift。
- 面試官：評估前端工程、資料視覺化、即時系統、domain modeling 與產品思維。

## 功能模組

### 即時總覽 Dashboard

- Fab health score
- Realtime stream health panel
- KPI cards
- Active bottleneck
- Recommended next actions
- Process-control charts
- Equipment health matrix
- Live incident stream

### Factory Map / Digital Twin

- 生產流程站點
- 區域設備地圖
- 設備點選詳情
- 異常設備高亮
- 站點風險與 WIP queue

### Alarm Center

- 告警 KPI
- 優先級與處理狀態
- 搜尋與篩選
- 告警清單
- 事件時間線
- 處置建議

### Analytics

- 日報 / 週報 / 月報
- OEE / WPH 趨勢
- Yield loss attribution
- Downtime Pareto
- Equipment ranking
- Management brief

### AI Insights

- Rule-based anomaly scoring
- Remaining Useful Life demo
- Risk ranking
- Signal contribution factors
- Predictive maintenance queue

> AI Insights 是 rule-based demo，用於展示智慧製造決策層的前端呈現方式。未來可替換為後端 ML inference API。

## 技術棧

- Vue 3 Composition API
- TypeScript strict mode
- Pinia
- Vue Router lazy loading
- Naive UI
- Apache ECharts + `vue-echarts`
- Vite 8
- GitHub Pages deployment

## 專案結構

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

## 工程亮點

- Route-level lazy loading：每個頁面獨立載入。
- Demo-first realtime design：沒有後端也能展示完整流程。
- WebSocket adapter：包含 heartbeat、latency、reconnect attempts 與 demo fallback。
- Pinia domain store：集中設備、KPI、series、logs、realtime status 與衍生指標。
- ECharts components：圖表邏輯隔離在 chart components 中。
- Enterprise UI：使用 Naive UI、light/dark theme variables 與高資訊密度 dashboard layout。
- Vite manual chunks：拆分 `vue-vendor`、`ui`、`charts`、`zrender`。

## 本機開發

```bash
npm install
npm run dev
```

開啟：

```text
http://127.0.0.1:5173/
```

Production build：

```bash
npm run build
```

Preview：

```bash
npm run preview
```

## GitHub Pages 部署

本專案使用 `gh-pages` 分支部署到 GitHub Pages，不依賴 GitHub CLI。

部署流程：

```bash
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

Vite base path 已設定為：

```ts
base: process.env.GITHUB_PAGES || process.env.GITHUB_ACTIONS ? '/FabOps_Dashboard/' : '/'
```

## 面試講解範例

可以用下面順序展示：

1. 先開首頁說明 Fab 現場需要即時監控設備健康、KPI 與瓶頸。
2. 指出 realtime stream panel，說明 heartbeat、latency、reconnect attempts 與 demo fallback。
3. 切到 Factory Map，說明 Digital Twin 如何定位異常設備與流程影響。
4. 切到 AI Insights，說明 anomaly score、RUL 與預測維修建議。
5. 切到 Alarm Center，說明現場如何追蹤告警優先級與處置。
6. 切到 Analytics，說明主管如何用 OEE、良率、停機與排名做班報回顧。

## 後續可擴充

- 接入真實 WebSocket / SSE backend
- 建立 MQTT / OPC UA gateway demo
- 將 rule-based AI 替換為 ML inference API
- 加入部署截圖與 GitHub Pages 狀態說明
- 加入 ESLint / Prettier / Vitest
- 補正式截圖與部署連結預覽圖
