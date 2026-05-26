// ─────────────────────────────────────────────
// 設備狀態型別（與前端 types/equipment.ts 對齊）
// ─────────────────────────────────────────────

export type MachineStatus = 'running' | 'idle' | 'error' | 'maintenance'
export type LogLevel = 'ok' | 'warn' | 'error'
export type MachineType = 'CVD' | 'ETCH' | 'CMP' | 'IMP' | 'LITHO' | 'DIFF'

export interface MachineState {
  id: string
  name: string
  type: MachineType
  status: MachineStatus
  temperature?: number    // °C
  pressure?: number       // mTorr
  rfPower?: number        // W
  flowRate?: number       // sccm
  rpm?: number
  energy?: number         // keV
  dose?: string
  slurryFlow?: number     // mL/min
  wph: number
  totalWafers: number
  errorCode?: string
  downtimeSec?: number
}

// ─────────────────────────────────────────────
// WebSocket 推送格式（後端 → 前端）
// ─────────────────────────────────────────────
export interface WsPayload {
  machineId: string
  timestamp: number       // Unix ms
  temperature?: number
  pressure?: number
  flowRate?: number
  rfPower?: number
  rpm?: number
  wph?: number
}

// ─────────────────────────────────────────────
// SSE 事件格式（後端 → 前端）
// ─────────────────────────────────────────────
export interface SseEvent {
  level: LogLevel
  message: string
  machineId?: string
  timestamp: number
}

// ─────────────────────────────────────────────
// WebSocket 前端 → 後端指令（可選）
// ─────────────────────────────────────────────
export type WsCommandType = 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'REQUEST_SNAPSHOT'

export interface WsCommand {
  type: WsCommandType
  machineIds?: string[]   // 訂閱特定機台
}
