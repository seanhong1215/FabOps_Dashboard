import { ref, onMounted, onUnmounted } from 'vue'
import type { WsMessage, WsReadyState } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipment'

export function useWebSocket(url = '') {
  const store = useEquipmentStore()
  const readyState = ref<WsReadyState>('connecting')
  const lastMessage = ref('')
  let ws: WebSocket | null = null
  let simulateTimer: ReturnType<typeof setInterval> | null = null

  function connectReal() {
    ws = new WebSocket(url)

    ws.onopen = () => {
      readyState.value = 'open'
      store.wsConnected = true
      store.addLog('ok', 'Realtime WebSocket connected')
    }

    ws.onmessage = (event: MessageEvent) => {
      lastMessage.value = event.data
      try {
        const data = JSON.parse(event.data as string) as WsMessage
        store.applyWsUpdate(data.machineId, data)
        store.simulateTick()
      } catch {
        store.addLog('warn', `Ignored malformed WebSocket payload: ${event.data}`)
      }
    }

    ws.onclose = () => {
      readyState.value = 'closed'
      store.wsConnected = false
      store.addLog('warn', 'WebSocket closed. Reconnecting in 3 seconds.')
      setTimeout(connectReal, 3000)
    }

    ws.onerror = () => {
      readyState.value = 'error'
      store.wsConnected = false
      store.addLog('error', 'WebSocket transport error')
    }
  }

  const demoLogs = [
    { level: 'ok' as const, msg: 'CVD-01 process window stable after gas flow correction', machineId: 'CVD-01' },
    { level: 'warn' as const, msg: 'LITHO-02 overlay drift exceeds guard band by 0.3 nm', machineId: 'LITHO-02' },
    { level: 'error' as const, msg: 'Scanner stage fault E-0412 requires engineering review', machineId: 'LITHO-02' },
    { level: 'ok' as const, msg: 'ETCH-03 RF match recovered and throughput is on plan', machineId: 'ETCH-03' },
    { level: 'ok' as const, msg: 'IMP-01 dose verification passed at 2.1E15 ions/cm2', machineId: 'IMP-01' },
    { level: 'warn' as const, msg: 'CMP-02 idle queue waiting for slurry tank validation', machineId: 'CMP-02' },
    { level: 'ok' as const, msg: 'DIFF-01 furnace temperature tracking within recipe band', machineId: 'DIFF-01' },
    { level: 'ok' as const, msg: 'MES dispatch list synchronized for priority lots' },
  ]

  let demoLogIdx = 0
  let tickCount = 0

  function startSimulation() {
    readyState.value = 'open'
    store.wsConnected = true
    store.addLog('ok', 'Demo realtime stream started')
    store.simulateTick()

    simulateTimer = setInterval(() => {
      tickCount++
      store.simulateTick()

      if (tickCount % 4 === 0) {
        const { level, msg, machineId } = demoLogs[demoLogIdx % demoLogs.length]
        store.addLog(level, msg, machineId)
        demoLogIdx++
      }
    }, 2000)
  }

  onMounted(() => {
    if (url) {
      connectReal()
    } else {
      startSimulation()
    }
  })

  onUnmounted(() => {
    ws?.close()
    if (simulateTimer) clearInterval(simulateTimer)
  })

  function disconnect() {
    ws?.close()
    if (simulateTimer) clearInterval(simulateTimer)
    store.wsConnected = false
    readyState.value = 'closed'
  }

  return { readyState, lastMessage, disconnect }
}
