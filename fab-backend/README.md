# FAB Backend — Node.js Fastify WebSocket + SSE

## 技術棧
- **Fastify 4** — 高效能 Node.js 框架
- **@fastify/websocket** — WebSocket 支援
- **@fastify/cors** — CORS 設定
- **TypeScript 5** — 完整型別

## 專案結構
```
src/
├── types/index.ts                # 型別定義（與前端共享）
├── mock/equipmentSimulator.ts    # 模擬 OPC-UA / SECS-GEM 資料來源
├── routes/
│   ├── websocket.ts              # WS 路由 /ws/equipment
│   └── sse.ts                    # SSE 路由 /events/stream + REST
└── index.ts                      # Fastify 主程式入口
```

## 啟動
```bash
npm install
npm run dev       # 開發模式（熱重載）
npm run build
npm start         # 生產模式
```

## 端點

| 協定 | 路徑 | 說明 |
|------|------|------|
| WebSocket | `ws://localhost:3000/ws/equipment` | 每 2s 推送設備即時數值 |
| SSE | `GET /events/stream` | 每 8s 推送事件日誌 |
| REST | `GET /api/machines` | 取得所有機台快照 |
| REST | `POST /api/events/emit` | 手動發送事件（測試） |
| REST | `GET /health` | 健康檢查 |

## 前端對接

修改 `fab-dashboard/src/views/DashboardView.vue`：

```ts
// 改成真實後端 URL
useWebSocket('ws://localhost:3000/ws/equipment')
useSSE('http://localhost:3000/events/stream')
```

## WebSocket 訊息格式

後端 → 前端（每 2s）：
```json
{
  "machineId": "CVD-01",
  "timestamp": 1748736000000,
  "temperature": 313.5,
  "pressure": 4.21,
  "flowRate": 86.3,
  "wph": 125
}
```

快照（連線後立即推送）：
```json
{
  "type": "SNAPSHOT",
  "data": [ { "id": "CVD-01", "status": "running", ... } ]
}
```

前端 → 後端（可選指令）：
```json
{ "type": "REQUEST_SNAPSHOT" }
{ "type": "SUBSCRIBE", "machineIds": ["CVD-01", "ETCH-03"] }
```

## SSE 訊息格式

```
data: {"level":"ok","message":"CVD-01 製程參數正常","machineId":"CVD-01","timestamp":1748736000000}

data: {"level":"warn","message":"CMP-02 研磨液感測器訊號偏低","machineId":"CMP-02","timestamp":1748736008000}
```

## 替換真實資料來源

`src/mock/equipmentSimulator.ts` 中的 `readMachinePayload()` 函式，
改為呼叫 OPC-UA client：

```ts
import { OPCUAClient, AttributeIds } from 'node-opcua'

// 連線到設備的 OPC-UA Server
const client = OPCUAClient.create({ endpointMustExist: false })
await client.connect('opc.tcp://192.168.1.100:4840')
const session = await client.createSession()

// 讀取節點
const result = await session.readVariableValue('ns=2;s=CVD-01.Temperature')
const temperature = result.value.value as number
```
