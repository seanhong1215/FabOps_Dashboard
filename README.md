# 半導體廠務營運儀表板

這個 workspace 包含一個半導體 FabOps 即時營運儀表板作品集專案，分成前台 Vue dashboard 與後台 Fastify realtime server。

```text
.
├─ fab-dashboard/   # Vue 3 + Vite + Pinia 前端儀表板
└─ fab-backend/     # Fastify + WebSocket + SSE 後端
```

## 技術棧

前台：

- Vue 3 Composition API
- TypeScript
- Vite
- Pinia
- Vue Router
- Naive UI
- ECharts / vue-echarts

後台：

- Node.js
- TypeScript
- Fastify
- `@fastify/websocket`
- `@fastify/cors`
- Server-Sent Events

## 現有功能

- Fab health command center：即時狀態、Fab health score、機台運轉數、異常數、queue。
- KPI dashboard：OEE、WPH、First Pass Yield、Avg CVD Temp。
- 瓶頸分析：依各機台 WPH / targetWph 找出 active bottleneck。
- 製程圖表：CVD temperature、WPH by tool、Yield split、Pressure / gas flow。
- 機台矩陣：顯示 status、recipe、owner、availability、utilization、queue、signals、incident。
- 事件流：live incident stream，支援 severity、timestamp、machine id、message。
- Light/dark theme：由前台 app shell 控制。
- 後台 realtime endpoints：WebSocket telemetry、SSE event stream、machine snapshot、manual event emit、health check。

## 架構摘要

前台資料流以 Pinia store 為中心：

```text
DashboardView.vue
  ├─ useWebSocket()
  ├─ useSSE()
  └─ useEquipmentStore()

equipment store
  ├─ machines / kpi / time series / logs / wsConnected
  ├─ computed metrics: fabHealth, bottleneck, wphByMachine
  └─ actions: applyWsUpdate, simulateTick, addLog
```

目前前台預設可用 Demo mode；Dashboard 上可切換 `Demo` / `Backend Live`。Demo mode 會在瀏覽器端模擬 telemetry；Backend Live 會讀取 `VITE_WS_URL` 與 `VITE_SSE_URL`，未設定時預設連本機後端。

```text
VITE_WS_URL=ws://localhost:3000/ws/equipment
VITE_SSE_URL=http://localhost:3000/events/stream
```

後台資料流：

```text
mock/equipmentSimulator.ts
  ├─ 產生機台 telemetry payload
  ├─ 維護 downtime
  └─ 產生事件 log

routes/websocket.ts
  └─ /ws/equipment 每 2 秒推送機台 telemetry

routes/sse.ts
  ├─ /events/stream 每 8 秒推送事件
  ├─ /api/machines 回傳機台 snapshot
  └─ /api/events/emit 手動推送事件
```

## 開發

前台：

```bash
cd fab-dashboard
npm install
npm run dev
```

預設網址：

```text
http://127.0.0.1:5173/
```

後台：

```bash
cd fab-backend
npm install
npm run dev
```

預設 endpoints：

```text
GET  http://localhost:3000/health
GET  http://localhost:3000/api/machines
GET  http://localhost:3000/events/stream
WS   ws://localhost:3000/ws/equipment
POST http://localhost:3000/api/events/emit
```

## 驗證

前台：

```bash
cd fab-dashboard
npm run type-check
npm run build
```

## 部署：GitHub Pages + Live Backend

GitHub Pages 只能部署前端靜態檔，不能執行 Fastify、WebSocket 或 SSE 後端。正式展示時建議：

```text
GitHub Pages      → fab-dashboard 靜態前端
Render / Railway  → fab-backend Node.js 即時後端
```

### 1. 部署後端到 Render / Railway

後端 service 設定：

```text
Root directory: fab-backend
Build command: npm install && npm run build
Start command: npm start
```

環境變數：

```text
PORT=3000
HOST=0.0.0.0
ALLOWED_ORIGINS=https://你的-github-帳號.github.io
```

上線後確認：

```text
GET  https://你的後端網域/health
GET  https://你的後端網域/api/machines
GET  https://你的後端網域/events/stream
WS   wss://你的後端網域/ws/equipment
```

### 2. 部署前端到 GitHub Pages

前端 build 時設定：

```text
VITE_WS_URL=wss://你的後端網域/ws/equipment
VITE_SSE_URL=https://你的後端網域/events/stream
```

本機開發可參考：

```text
fab-dashboard/.env.example
fab-backend/.env.example
```

部署後切換 Dashboard 的 `Backend Live`，前端會連到上述 `VITE_WS_URL` 與 `VITE_SSE_URL`。`Demo` 模式仍不依賴後端，適合後端休眠或面試現場快速展示。

後台：

```bash
cd fab-backend
npm run type-check
npm run build
```

## 新功能迭代規則

請先閱讀根目錄 `AGENTS.md`。新增功能時先評估會影響哪些層：

- `types`
- Pinia store
- composables
- Vue route
- view / components
- backend routes
- mock simulator

修改方式採增量修改：新增檔案需說明用途，修改既有檔案需標出修改區塊與前後對齊標記；資料 shape 改變時，前後端 types 需要同步檢查。
