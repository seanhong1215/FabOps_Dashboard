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
  lastSeenAt?: number
  dataQuality?: DataQuality
}

export type DataQuality = 'fresh' | 'stale' | 'offline'

export type MachineSnapshot = Pick<
  Machine,
  'id' | 'name' | 'type' | 'status' | 'wph' | 'totalWafers'
> & Partial<Machine>

export interface WsTelemetryMessage {
  machineId: string
  timestamp: number
  temperature?: number
  pressure?: number
  flowRate?: number
  rfPower?: number
  wph?: number
  yield?: number
}

export interface WsSnapshotMessage {
  type: 'SNAPSHOT'
  data: MachineSnapshot[]
}

export interface WsSystemMessage {
  type: 'SYSTEM'
  timestamp: number
  message: string
  level?: LogLevel
}

export type WsMessage = WsTelemetryMessage | WsSnapshotMessage | WsSystemMessage

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

export type WsReadyState = 'connecting' | 'open' | 'reconnecting' | 'closed' | 'error'

export type StreamMode = 'demo' | 'live'

export type HeartbeatStatus = 'healthy' | 'delayed' | 'offline'
