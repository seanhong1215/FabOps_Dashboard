# AGENTS.md

## 專案定位

這個 workspace 是「半導體廠務營運儀表板」作品集專案，分成前台 `fab-dashboard` 與後台 `fab-backend` 兩個 Node/TypeScript 子專案。

目標是讓新功能可以在既有架構上增量迭代：先理解目前資料流、狀態管理、路由與元件邊界，再提出影響範圍與具體修改點，避免直接重寫整份檔案。

## 專案結構

```text
.
├─ fab-dashboard/   # Vue 3 儀表板前端
└─ fab-backend/     # Fastify 即時資料後端
```

### 前台 `fab-dashboard`

核心技術：

- Vue 3 Composition API
- TypeScript strict mode
- Vite
- Pinia
- Vue Router
- Naive UI
- Apache ECharts + `vue-echarts`
- `@vicons/tabler`

重要檔案：

- `src/main.ts`：建立 Vue app，註冊 Pinia 與 Vue Router。
- `src/App.vue`：全域 app shell、Naive UI provider、中文 locale、light/dark theme、header。
- `src/router/index.ts`：目前只有 `/`，以 lazy loading 載入 `DashboardView.vue`。
- `src/views/DashboardView.vue`：主儀表板頁面，組合 KPI、瓶頸分析、圖表、機台矩陣與事件流。
- `src/stores/equipment.ts`：Pinia equipment store，保存機台、KPI、time series、事件 log、連線狀態與衍生指標。
- `src/types/equipment.ts`：前端 domain types，包含 Machine、KPI、Log、WebSocket payload、chart point。
- `src/composables/useWebSocket.ts`：WebSocket adapter；未傳 URL 時啟動前端 demo simulation。
- `src/composables/useSSE.ts`：SSE adapter；未傳 URL 時不連線。
- `src/components/*Chart.vue`：ECharts 圖表元件。
- `src/components/KpiCard.vue`、`MachineStatus.vue`、`EventLog.vue`：儀表板卡片與事件列表。
- `src/utils/format.ts`：狀態文字、tag type、時間與數字格式化。
- `vite.config.ts`：`@` alias、dev server port 5173、production manual chunks。

### 後台 `fab-backend`

核心技術：

- Fastify 4
- TypeScript
- `@fastify/cors`
- `@fastify/websocket`
- `tsx` dev runtime

重要檔案：

- `src/index.ts`：Fastify bootstrap、CORS、WebSocket plugin、routes、`/health`。
- `src/routes/websocket.ts`：`GET /ws/equipment` WebSocket endpoint，定時廣播機台 telemetry。
- `src/routes/sse.ts`：`GET /events/stream` SSE endpoint、`GET /api/machines`、`POST /api/events/emit`。
- `src/mock/equipmentSimulator.ts`：模擬 OPC-UA / SECS-GEM / MES 資料來源，產生機台 payload 與事件。
- `src/types/index.ts`：後端 MachineState、WsPayload、SseEvent、WsCommand types。

## 現有功能

前台目前提供：

- Fab command center hero：即時串流狀態、Fab health score、running/down tool、queued lots。
- KPI cards：Overall OEE、Line WPH、First Pass Yield、Avg CVD Temp。
- Active bottleneck：以 WPH / targetWph 比例找出目前瓶頸機台。
- Shift focus：固定的建議處置清單。
- Charts：CVD temperature、WPH by tool、Yield split、Pressure and gas flow。
- Equipment fleet：機台狀態矩陣，顯示 recipe、owner、availability、utilization、queue、WPH、signals、incident。
- Live incident stream：即時事件 log，含 severity、timestamp、machine id、message。
- Light/dark theme：由 `App.vue` 控制並透過 `provide('isDark')` 傳給 dashboard/chart。

後台目前提供：

- WebSocket telemetry stream：`ws://localhost:3000/ws/equipment`。
- SSE event stream：`http://localhost:3000/events/stream`。
- Machine snapshot：`GET /api/machines`。
- Manual event emit：`POST /api/events/emit`。
- Health check：`GET /health`。

## 資料流

目前前端預設是 demo-first：

```text
DashboardView.vue
  ├─ useEquipmentStore()
  ├─ useWebSocket()       # 沒有 URL 時啟動前端 setInterval 模擬資料
  └─ useSSE()             # 沒有 URL 時不建立 EventSource

useWebSocket()
  ├─ startSimulation()
  ├─ store.simulateTick()
  └─ store.addLog()

equipment store
  ├─ machines / kpi / time series / logs / wsConnected / lastUpdated
  ├─ computed: runningCount, errorCount, totalQueue, fabHealth, wphByMachine, bottleneck
  └─ actions: applyWsUpdate, simulateTick, addLog

Dashboard components
  └─ 透過 props 接收 store state 或 computed 結果後渲染 UI
```

若要改成連後端，需要在 `DashboardView.vue` 對 composables 傳入 URL：

```ts
useWebSocket('ws://localhost:3000/ws/equipment')
useSSE('http://localhost:3000/events/stream')
```

後端資料流：

```text
equipmentSimulator.ts
  ├─ readAllPayloads()
  ├─ tickDowntime()
  ├─ getAllMachines()
  └─ nextEventLog()

websocket.ts
  └─ 每 2 秒 broadcast telemetry payload 給所有 WS clients

sse.ts
  ├─ 每 8 秒 broadcast event log 給所有 SSE clients
  ├─ GET /api/machines 回傳 snapshot
  └─ POST /api/events/emit 手動推送事件
```

## 迭代協作規則

新功能開始前，先做現況分析與影響評估：

1. 確認需求會碰到哪些層：`types`、store、composable、route、view、component、backend route、mock simulator。
2. 若資料 shape 改變，先更新 type，再調整 store/composable/API，最後修改 UI。
3. 若新增頁面，先檢查 `src/router/index.ts`，維持 route-level lazy loading。
4. 若新增跨元件狀態，優先放在 Pinia store；單一元件內部狀態留在該元件。
5. 若串接後端，優先沿用 `useWebSocket`、`useSSE` 或新增同風格 composable，不要在 view 直接堆連線邏輯。
6. 若新增機台欄位，前後端 types 需要同步檢查：`fab-dashboard/src/types/equipment.ts` 與 `fab-backend/src/types/index.ts`。
7. 若上下文不足，先提問，不盲目改動核心資料流。

## 修改輸出格式

提出或執行修改時，使用增量修改方式：

- 說明新增檔案路徑與用途。
- 說明修改檔案路徑與修改區塊。
- 對既有檔案提供前後關鍵代碼作為定位標記。
- 避免直接貼整份全新檔案，除非檔案本身就是新增的小型檔案。

## 程式風格

- 保持 Vue `<script setup lang="ts">`、Composition API 與現有命名風格。
- TypeScript 必須符合 strict mode、`noUnusedLocals`、`noUnusedParameters`。
- 前端 import alias 使用 `@/`。
- UI 優先沿用 Naive UI 元件、既有 CSS variables 與卡片樣式。
- 圖表優先封裝在 `components/*Chart.vue`，不要把 ECharts option 大量塞進 view。
- 後端 route 維持 Fastify plugin function 風格。
- 模擬資料集中在 `mock/equipmentSimulator.ts`，不要散落在 route。

## 常用指令

前台：

```bash
cd fab-dashboard
npm run dev
npm run type-check
npm run build
npm run preview
```

後台：

```bash
cd fab-backend
npm run dev
npm run type-check
npm run build
npm start
```

## 已知注意事項

- 根目錄目前不是 Git repository；若要提交變更，需確認實際 repo 邊界。
- `fab-dashboard/AGENTS.md` 與部分後端註解目前顯示為亂碼，疑似舊檔案編碼不一致；新文件請使用 UTF-8。
- 前台 demo mode 不依賴後台即可運行；真正串接後端時要顯式傳入 WebSocket/SSE URL。
- 後端 CORS allowlist 目前包含 localhost/127.0.0.1 的 5173 與 4173，以及 `.company.com`。
