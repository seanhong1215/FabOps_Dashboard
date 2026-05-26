import { ref, onMounted, onUnmounted, unref, watch, type MaybeRef } from 'vue'
import { useEquipmentStore } from '@/stores/equipment'
import type { LogLevel } from '@/types/equipment'

interface SsePayload {
  level?: LogLevel
  message?: string
  machineId?: string
}

export function useSSE(url: MaybeRef<string> = '') {
  const store = useEquipmentStore()
  const connected = ref(false)
  let source: EventSource | null = null

  function disconnect() {
    source?.close()
    source = null
    connected.value = false
    store.setSseConnected(false)
  }

  function connect(targetUrl: string) {
    disconnect()
    if (!targetUrl) return

    source = new EventSource(targetUrl)

    source.onopen = () => {
      connected.value = true
      store.setSseConnected(true)
      store.addLog('ok', 'SSE event stream connected')
    }

    source.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as SsePayload
        store.addLog(data.level ?? 'ok', data.message ?? event.data, data.machineId)
      } catch {
        store.addLog('ok', event.data as string)
      }
    }

    source.onerror = () => {
      connected.value = false
      store.setSseConnected(false)
      store.addLog('warn', 'SSE stream disconnected')
    }
  }

  onMounted(() => connect(unref(url)))

  watch(
    () => unref(url),
    nextUrl => {
      connect(nextUrl)
    }
  )

  onUnmounted(() => {
    disconnect()
  })

  return { connected }
}
