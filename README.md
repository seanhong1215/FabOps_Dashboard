# FabOps Dashboard

FabOps Dashboard is an interview-ready semiconductor fab operations cockpit. It presents realtime tool health, production KPIs, bottleneck analysis, process trends, and incident activity in a polished Vue 3 dashboard.

The current UI is designed for a shift lead or equipment engineer who needs to understand line health at a glance and decide what to do next.

## Architecture Summary

This frontend is a Vue 3 + Vite single-page dashboard. The app is currently demo-first: it can run without the backend because `useWebSocket()` starts an in-browser telemetry simulation when no URL is provided.

```text
src/main.ts
  `- createApp(App).use(createPinia()).use(router)

src/App.vue
  |- Naive UI config provider
  |- zhTW/dateZhTW locale
  |- light/dark theme toggle
  `- router-view

src/router/index.ts
  `- / -> lazy-loaded DashboardView.vue

src/views/DashboardView.vue
  |- useEquipmentStore()
  |- useWebSocket()
  |- useSSE()
  `- dashboard sections and component composition

src/stores/equipment.ts
  |- machines / kpi / time series / logs / wsConnected / lastUpdated
  |- computed metrics: runningCount, errorCount, totalQueue, fabHealth, wphByMachine, bottleneck
  `- actions: applyWsUpdate, simulateTick, addLog
```

## Data Flow

Default demo mode:

```text
DashboardView.vue
  `- useWebSocket()
       `- startSimulation()
            |- store.simulateTick()
            `- store.addLog()

equipment store
  `- reactive state + computed metrics

components
  `- receive store data through props and render UI
```

Backend-connected mode:

```ts
useWebSocket('ws://localhost:3000/ws/equipment')
useSSE('http://localhost:3000/events/stream')
```

The backend project is expected at `../fab-backend` and provides:

- `WS /ws/equipment` for telemetry payloads.
- `GET /events/stream` for incident events.
- `GET /api/machines` for machine snapshots.
- `POST /api/events/emit` for manual event push.
- `GET /health` for server health.

## Current UI

- Command center hero with realtime stream status, Fab health score, running/down tool counts, and queued lot total.
- KPI cards for Overall OEE, Line WPH, First Pass Yield, and Avg CVD Temperature.
- Active bottleneck panel that identifies the constrained tool, throughput gap, queue impact, owner, and status.
- Shift focus panel with recommended next actions for operations triage.
- Process-control charts for CVD chamber temperature, WPH by tool, yield split, chamber pressure, and process gas flow.
- Equipment health matrix showing each tool's status, recipe, owner, WPH target progress, availability, utilization, queue, wafer count, signals, and active incident.
- Live incident stream with severity, timestamp, machine id, and simulated event messages.
- Sticky application shell with brand identity, demo-data badge, and light/dark theme toggle.

## Engineering Highlights

- Vue 3 Composition API with strict TypeScript.
- Pinia store models realtime fab state, derived metrics, bottleneck calculation, and demo telemetry.
- WebSocket and SSE composables are ready for real endpoints, while the app runs fully in demo mode without a backend.
- ECharts components are isolated and reusable for line, bar, donut, and dual-axis charts.
- Route-level lazy loading keeps page code out of the initial router bundle.
- Vite manual chunks split Vue, Naive UI, ECharts, and zrender into cache-friendly production assets.
- Responsive layout supports desktop review and mobile inspection.

## Tech Stack

- Vue 3 + Composition API
- TypeScript
- Pinia
- Vue Router
- Naive UI
- Apache ECharts + vue-echarts
- Vite

## Project Structure

```text
src/
  components/        KPI cards, machine cards, event log, and chart widgets
  composables/       WebSocket and SSE stream adapters
  router/            Lazy-loaded route definitions
  stores/            Pinia equipment store and demo telemetry simulation
  types/             Machine, KPI, log, stream, and chart data contracts
  utils/             Formatting and machine status helpers
  views/             Dashboard page composition
  App.vue            Sticky app shell, branding, and theme control
  main.ts            Vue app bootstrap
```

## Feature Iteration Notes

Before adding a new frontend feature, check the affected layer:

- Domain shape changes belong in `src/types/equipment.ts` first.
- Shared realtime state belongs in `src/stores/equipment.ts`.
- Transport logic belongs in `src/composables/useWebSocket.ts`, `src/composables/useSSE.ts`, or a new composable with the same style.
- New pages should be added through `src/router/index.ts` with route-level lazy loading.
- Dashboard composition belongs in `src/views/DashboardView.vue`.
- Reusable UI belongs in `src/components/`.
- Formatting and status mapping belong in `src/utils/format.ts`.

When a feature depends on backend data, also check `../fab-backend/src/types/index.ts`, `../fab-backend/src/routes/`, and `../fab-backend/src/mock/equipmentSimulator.ts` so frontend and backend payloads stay aligned.

Use incremental changes for future work: list added files, list modified files, and identify the exact code blocks being changed instead of replacing whole existing files.

## Development

```bash
npm install
npm run dev
```

Open the local app:

```text
http://127.0.0.1:5173/
```

Production build:

```bash
npm run build
```

## Production Bundle Strategy

The Vite build is configured to generate separate chunks for major vendor groups:

- `vue-vendor`: Vue, Vue Router, and Pinia
- `ui`: Naive UI and icon dependencies
- `charts`: ECharts and vue-echarts
- `zrender`: ECharts rendering engine

This keeps the initial app shell small and improves browser caching when dashboard business logic changes.
