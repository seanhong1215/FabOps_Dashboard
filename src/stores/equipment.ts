import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Machine,
  KpiData,
  TimeSeriesPoint,
  LogEntry,
  LogLevel,
  StreamMode,
  HeartbeatStatus,
  WsReadyState,
} from '@/types/equipment'

const INITIAL_MACHINES: Machine[] = [
  {
    id: 'CVD-01',
    name: 'CVD-01',
    type: 'CVD',
    area: 'Thin Film',
    recipe: 'SiN 4.2',
    owner: 'Team Alpha',
    status: 'running',
    availability: 96,
    utilization: 88,
    temperature: 314,
    pressure: 4.2,
    flowRate: 85,
    wph: 124,
    targetWph: 128,
    totalWafers: 1842,
    queue: 17,
  },
  {
    id: 'ETCH-03',
    name: 'ETCH-03',
    type: 'ETCH',
    area: 'Etch Bay',
    recipe: 'Poly Gate',
    owner: 'Team Delta',
    status: 'running',
    availability: 94,
    utilization: 91,
    rfPower: 1250,
    flowRate: 85,
    wph: 118,
    targetWph: 120,
    totalWafers: 2107,
    queue: 22,
  },
  {
    id: 'CMP-02',
    name: 'CMP-02',
    type: 'CMP',
    area: 'Planarization',
    recipe: 'Oxide Polish',
    owner: 'Team Beta',
    status: 'idle',
    availability: 89,
    utilization: 52,
    rpm: 0,
    slurryFlow: 0,
    wph: 0,
    targetWph: 96,
    totalWafers: 987,
    queue: 3,
  },
  {
    id: 'IMP-01',
    name: 'IMP-01',
    type: 'IMP',
    area: 'Implant',
    recipe: 'N+ Source',
    owner: 'Team Ion',
    status: 'running',
    availability: 92,
    utilization: 84,
    energy: 80,
    dose: '2.1E15',
    wph: 105,
    targetWph: 110,
    totalWafers: 1543,
    queue: 14,
  },
  {
    id: 'LITHO-02',
    name: 'LITHO-02',
    type: 'LITHO',
    area: 'Lithography',
    recipe: 'M1 Overlay',
    owner: 'Team Focus',
    status: 'error',
    availability: 61,
    utilization: 0,
    errorCode: 'E-0412',
    downtimeSec: 754,
    wph: 0,
    targetWph: 145,
    totalWafers: 3201,
    queue: 31,
  },
  {
    id: 'DIFF-01',
    name: 'DIFF-01',
    type: 'DIFF',
    area: 'Thermal',
    recipe: 'Anneal 900C',
    owner: 'Team Furnace',
    status: 'running',
    availability: 97,
    utilization: 86,
    temperature: 900,
    flowRate: 2.5,
    wph: 131,
    targetWph: 132,
    totalWafers: 4421,
    queue: 19,
  },
]

const MAX_SERIES_LENGTH = 36

function nowHMS(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function randBetween(min: number, max: number, decimals = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals))
}

export const useEquipmentStore = defineStore('equipment', () => {
  const machines = ref<Machine[]>(INITIAL_MACHINES.map(m => ({ ...m })))
  const kpi = ref<KpiData>({
    oee: 87.4,
    wph: 124,
    yield: 96.1,
    avgTemp: 312,
    oeeChange: 1.2,
  })

  const temperatureSeries = ref<TimeSeriesPoint[]>([])
  const pressureSeries = ref<TimeSeriesPoint[]>([])
  const flowSeries = ref<TimeSeriesPoint[]>([])
  const logs = ref<LogEntry[]>([])
  const wsConnected = ref(false)
  const lastUpdated = ref('')
  const streamMode = ref<StreamMode>('demo')
  const readyState = ref<WsReadyState>('closed')
  const reconnectAttempts = ref(0)
  const heartbeatStatus = ref<HeartbeatStatus>('offline')
  const latencyMs = ref(0)
  const lastHeartbeatAt = ref('')

  const machineById = computed(() =>
    (id: string) => machines.value.find(m => m.id === id)
  )

  const runningCount = computed(() =>
    machines.value.filter(m => m.status === 'running').length
  )

  const errorCount = computed(() =>
    machines.value.filter(m => m.status === 'error').length
  )

  const totalQueue = computed(() =>
    machines.value.reduce((sum, machine) => sum + machine.queue, 0)
  )

  const fabHealth = computed(() => {
    const averageAvailability =
      machines.value.reduce((sum, machine) => sum + machine.availability, 0) / machines.value.length
    return Math.round((averageAvailability * 0.45) + (kpi.value.oee * 0.35) + (kpi.value.yield * 0.2))
  })

  const wphByMachine = computed(() =>
    machines.value.map(m => ({ id: m.id, wph: m.wph, target: m.targetWph }))
  )

  const bottleneck = computed(() =>
    [...machines.value].sort((a, b) => (a.wph / a.targetWph) - (b.wph / b.targetWph))[0]
  )

  const streamQuality = computed(() => {
    if (!wsConnected.value) return 'offline'
    if (heartbeatStatus.value === 'delayed' || latencyMs.value > 900) return 'watch'
    return 'healthy'
  })

  function applyWsUpdate(machineId: string, patch: Partial<Machine>) {
    const idx = machines.value.findIndex(m => m.id === machineId)
    if (idx !== -1) {
      machines.value[idx] = { ...machines.value[idx], ...patch }
    }
  }

  function pushSeries(target: typeof temperatureSeries, value: number) {
    target.value.push({ time: nowHMS(), value })
    if (target.value.length > MAX_SERIES_LENGTH) {
      target.value.shift()
    }
  }

  function addLog(level: LogLevel, message: string, machineId?: string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowHMS(),
      level,
      message,
      machineId,
    }
    logs.value.unshift(entry)
    if (logs.value.length > 60) logs.value.pop()
  }

  function setStreamMode(mode: StreamMode) {
    streamMode.value = mode
  }

  function setRealtimeState(state: WsReadyState, connected = state === 'open') {
    readyState.value = state
    wsConnected.value = connected
    if (!connected) {
      heartbeatStatus.value = 'offline'
    }
  }

  function setReconnectAttempts(count: number) {
    reconnectAttempts.value = count
  }

  function recordHeartbeat(latency: number) {
    latencyMs.value = Math.max(0, Math.round(latency))
    heartbeatStatus.value = latencyMs.value > 900 ? 'delayed' : 'healthy'
    lastHeartbeatAt.value = nowHMS()
  }

  function simulateTick() {
    const now = nowHMS()
    lastUpdated.value = now
    wsConnected.value = true
    readyState.value = 'open'

    const newTemp = randBetween(308, 318, 1)
    const newPressure = randBetween(3.9, 4.7, 2)
    const newFlow = randBetween(80, 92, 1)

    pushSeries(temperatureSeries, newTemp)
    pushSeries(pressureSeries, newPressure)
    pushSeries(flowSeries, newFlow)

    applyWsUpdate('CVD-01', {
      temperature: newTemp,
      pressure: newPressure,
      flowRate: newFlow,
      utilization: Math.round(randBetween(84, 92, 0)),
      wph: Math.round(randBetween(121, 128, 0)),
    })
    applyWsUpdate('DIFF-01', {
      temperature: randBetween(897, 904, 0),
      utilization: Math.round(randBetween(83, 90, 0)),
      wph: Math.round(randBetween(128, 134, 0)),
    })
    applyWsUpdate('ETCH-03', {
      rfPower: Math.round(randBetween(1230, 1270, 0)),
      utilization: Math.round(randBetween(88, 94, 0)),
      wph: Math.round(randBetween(115, 121, 0)),
    })
    applyWsUpdate('IMP-01', {
      utilization: Math.round(randBetween(80, 88, 0)),
      wph: Math.round(randBetween(101, 110, 0)),
    })

    kpi.value.avgTemp = newTemp
    kpi.value.oee = randBetween(85.5, 89.5, 1)
    kpi.value.yield = randBetween(95.2, 97.0, 1)
    kpi.value.wph = Math.round(randBetween(118, 130, 0))
    kpi.value.oeeChange = randBetween(0.4, 1.8, 1)

    const litho = machines.value.find(m => m.id === 'LITHO-02')
    if (litho && litho.downtimeSec !== undefined) {
      litho.downtimeSec += 2
    }
  }

  return {
    machines,
    kpi,
    temperatureSeries,
    pressureSeries,
    flowSeries,
    logs,
    wsConnected,
    lastUpdated,
    machineById,
    runningCount,
    errorCount,
    totalQueue,
    fabHealth,
    wphByMachine,
    bottleneck,
    streamMode,
    readyState,
    reconnectAttempts,
    heartbeatStatus,
    latencyMs,
    lastHeartbeatAt,
    streamQuality,
    applyWsUpdate,
    simulateTick,
    addLog,
    setStreamMode,
    setRealtimeState,
    setReconnectAttempts,
    recordHeartbeat,
  }
})
