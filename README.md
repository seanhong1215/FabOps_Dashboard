# FabOps Dashboard

半導體智慧製造營運平台 / Smart Manufacturing Operations Platform

FabOps Dashboard 是以 Vue 3 + TypeScript 建置的作品集專案，定位不是單純監控 dashboard，而是可展示「即時營運監控、Digital Twin、告警處置、營運分析、AI 風險判讀」的企業級前端平台。

## Live Demo

GitHub Pages:

```text
https://seanhong1215.github.io/FabOps_Dashboard/
```

此作品可在沒有後端服務的情況下以 demo mode 運作，前端會模擬設備 telemetry、即時事件、告警與 AI 風險訊號。

## 作品展示重點

- 即時總覽：Fab health、OEE、WPH、Yield、設備瓶頸與行動建議。
- 即時串流：WebSocket demo fallback、heartbeat、latency、reconnect attempts。
- Digital Twin：廠區流程、站點風險、設備位置與設備詳情。
- 告警中心：告警分級、搜尋篩選、事件時間線與處置建議。
- 營運分析：OEE / WPH 趨勢、良率損失、停機 Pareto、設備排名。
- AI 洞察：anomaly score、RUL、異常貢獻因子與預測維修佇列。

## 頁面導覽

| 頁面 | Route | 展示價值 |
| --- | --- | --- |
| 即時總覽 | `/` | 主管視角的產線健康、KPI、瓶頸與即時串流狀態 |
| 廠區地圖 | `/factory-map` | Digital Twin、製程流程、站點異常與設備定位 |
| 告警中心 | `/alarms` | 告警分級、處置狀態、事件追蹤與建議 |
| 營運分析 | `/analytics` | 趨勢分析、損失拆解、停機 Pareto 與班報摘要 |
| AI 洞察 | `/ai-insights` | 異常風險、RUL、特徵貢獻與預測維修展示 |

## 技術棧

- Vue 3 Composition API
- TypeScript strict mode
- Pinia
- Vue Router lazy loading
- Naive UI
- Apache ECharts + `vue-echarts`
- Vite 8
- GitHub Pages deployment via `gh-pages` branch

## 系統架構概念

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

目前作品採 demo-first 設計：沒有外部 WebSocket server 時，仍可由前端模擬資料流與連線健康狀態，方便現場或遠端展示。

## 本機啟動

```bash
npm install
npm run dev
```

預設網址：

```text
http://127.0.0.1:5173/
```

Production build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

## GitHub Pages 部署

此專案目前使用 `gh-pages` 分支部署，不依賴 GitHub CLI。

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

GitHub repository settings 需設定：

```text
Settings -> Pages -> Build and deployment -> Deploy from a branch -> gh-pages / root
```

## 更多專案說明

- 最新完整指南：[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)
- Codex 協作規則：[AGENTS.md](./AGENTS.md)
