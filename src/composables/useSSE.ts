import { ref, onMounted, onUnmounted } from 'vue'
import { useEquipmentStore } from '@/stores/equipment'
import type { LogLevel } from '@/types/equipment'

interface SsePayload {
  level?: LogLevel
  message?: string
  machineId?: string
}

export function useSSE(url = '') {
  const store = useEquipmentStore()
  const connected = ref(false)
  let source: EventSource | null = null

  function connect() {
    if (!url) return

    source = new EventSource(url)

    source.onopen = () => {
      connected.value = true
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
      store.addLog('warn', 'SSE stream disconnected')
    }
  }

  onMounted(connect)

  onUnmounted(() => {
    source?.close()
    connected.value = false
  })

  return { connected }
}
