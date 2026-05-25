export type MachineStatus = 'running' | 'idle' | 'error' | 'maintenance'

export type MachineType = 'CVD' | 'ETCH' | 'CMP' | 'IMP' | 'LITHO' | 'DIFF'

export interface Machine {
  id: string
  name: string
  type: MachineType
  area: string
  recipe: string
  owner: string
  status: MachineStatus
  availability: number
  utilization: number
  temperature?: number
  pressure?: number
  rfPower?: number
  flowRate?: number
  rpm?: number
  energy?: number
  dose?: string
  slurryFlow?: number
  wph: number
  targetWph: number
  totalWafers: number
  queue: number
  errorCode?: string
  downtimeSec?: number
}

export interface WsMessage {
  machineId: string
  timestamp: number
  temperature?: number
  pressure?: number
  flowRate?: number
  rfPower?: number
  wph?: number
  yield?: number
}

export interface TimeSeriesPoint {
  time: string
  value: number
}

export type LogLevel = 'ok' | 'warn' | 'error'

export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  message: string
  machineId?: string
}

export interface KpiData {
  oee: number
  wph: number
  yield: number
  avgTemp: number
  oeeChange: number
}

export type WsReadyState = 'connecting' | 'open' | 'closed' | 'error'
