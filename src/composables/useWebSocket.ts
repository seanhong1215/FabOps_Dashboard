import { ref, onMounted, onUnmounted } from 'vue'
import type { WsMessage, WsReadyState } from '@/types/equipment'
import { useEquipmentStore } from '@/stores/equipment'

export function useWebSocket(url = '') {
  const store = useEquipmentStore()
  const readyState = ref<WsReadyState>('connecting')
  const lastMessage = ref('')
  let ws: WebSocket | null = null
  let simulateTimer: ReturnType<typeof setInterval> | null = null
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  let isDisposed = false

  function connectReal() {
    store.setStreamMode('live')
    readyState.value = reconnectAttempts > 0 ? 'reconnecting' : 'connecting'
    store.setRealtimeState(readyState.value, false)
    ws = new WebSocket(url)

    ws.onopen = () => {
      readyState.value = 'open'
      store.setRealtimeState('open', true)
      store.setReconnectAttempts(reconnectAttempts)
      store.addLog('ok', 'Realtime WebSocket connected')
      startHeartbeat()
    }

    ws.onmessage = (event: MessageEvent) => {
      lastMessage.value = event.data
      try {
        const data = JSON.parse(event.data as string) as WsMessage
        const timestamp = typeof data.timestamp === 'number' ? data.timestamp : Date.now()
        store.recordHeartbeat(Date.now() - timestamp)
        store.applyWsUpdate(data.machineId, data)
        store.simulateTick()
      } catch {
        store.addLog('warn', `Ignored malformed WebSocket payload: ${event.data}`)
      }
    }

    ws.onclose = () => {
      stopHeartbeat()
      if (isDisposed) return
      reconnectAttempts++
      readyState.value = 'reconnecting'
      store.setRealtimeState('reconnecting', false)
      store.setReconnectAttempts(reconnectAttempts)
      store.addLog('warn', 'WebSocket closed. Reconnecting in 3 seconds.')
      reconnectTimer = setTimeout(connectReal, 3000)
    }

    ws.onerror = () => {
      readyState.value = 'error'
      store.setRealtimeState('error', false)
      store.addLog('error', 'WebSocket transport error')
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    heartbeatTimer = setInterval(() => {
      if (!ws || ws.readyState !== WebSocket.OPEN) return
      const sentAt = Date.now()
      try {
        ws.send(JSON.stringify({ type: 'ping', timestamp: sentAt }))
        store.recordHeartbeat(Date.now() - sentAt)
      } catch {
        store.setRealtimeState('error', false)
      }
    }, 5000)
  }

  function stopHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer)
    heartbeatTimer = null
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
    store.setStreamMode('demo')
    readyState.value = 'open'
    store.setRealtimeState('open', true)
    store.setReconnectAttempts(0)
    store.addLog('ok', 'Demo realtime stream started')
    store.recordHeartbeat(42)
    store.simulateTick()

    simulateTimer = setInterval(() => {
      tickCount++
      store.recordHeartbeat(38 + Math.round(Math.random() * 120))
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
    isDisposed = true
    ws?.close()
    if (simulateTimer) clearInterval(simulateTimer)
    if (reconnectTimer) clearTimeout(reconnectTimer)
    stopHeartbeat()
  })

  function disconnect() {
    isDisposed = true
    ws?.close()
    if (simulateTimer) clearInterval(simulateTimer)
    if (reconnectTimer) clearTimeout(reconnectTimer)
    stopHeartbeat()
    store.setRealtimeState('closed', false)
    readyState.value = 'closed'
  }

  return { readyState, lastMessage, disconnect }
}
