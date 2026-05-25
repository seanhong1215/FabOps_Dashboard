<template>
  <n-card size="small" title="即時事件串流" class="event-card" :bordered="false">
    <n-scrollbar style="max-height: 260px">
      <transition-group name="log" tag="div">
        <div
          v-for="entry in logs"
          :key="entry.id"
          class="log-row"
          :class="`log-row--${entry.level}`"
        >
          <span class="log-time">{{ entry.timestamp }}</span>
          <n-tag
            :type="levelToType(entry.level)"
            size="small"
            round
            class="level-tag"
          >
            {{ levelLabel(entry.level) }}
          </n-tag>
          <span v-if="entry.machineId" class="machine-id">{{ entry.machineId }}</span>
          <span class="log-msg">{{ translateLog(entry.message) }}</span>
        </div>
      </transition-group>
    </n-scrollbar>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NScrollbar, NTag } from 'naive-ui'
import type { LogEntry, LogLevel } from '@/types/equipment'

defineProps<{ logs: LogEntry[] }>()

function levelToType(level: LogLevel): 'success' | 'warning' | 'error' {
  return level === 'ok' ? 'success' : level === 'warn' ? 'warning' : 'error'
}

function levelLabel(level: LogLevel): string {
  return level === 'ok' ? '正常' : level === 'warn' ? '警示' : '異常'
}

function translateLog(message: string): string {
  return message
    .replace('Demo realtime stream started', '展示用即時串流已啟動')
    .replace('Realtime WebSocket connected', 'WebSocket 即時串流已連線')
    .replace('WebSocket closed. Reconnecting in 3 seconds.', 'WebSocket 已斷線，3 秒後重新連線')
    .replace('WebSocket transport error', 'WebSocket 傳輸異常')
    .replace('CVD-01 process window stable after gas flow correction', 'CVD-01 氣體流量校正後製程視窗穩定')
    .replace('LITHO-02 overlay drift exceeds guard band by 0.3 nm', 'LITHO-02 overlay drift 超出警戒線 0.3 nm')
    .replace('Scanner stage fault E-0412 requires engineering review', 'Scanner stage fault E-0412 需設備工程師複判')
    .replace('ETCH-03 RF match recovered and throughput is on plan', 'ETCH-03 RF match 已恢復，產出符合計畫')
    .replace('IMP-01 dose verification passed at 2.1E15 ions/cm2', 'IMP-01 dose verification 通過')
    .replace('CMP-02 idle queue waiting for slurry tank validation', 'CMP-02 等待 slurry tank 驗證，queue 暫停釋放')
    .replace('DIFF-01 furnace temperature tracking within recipe band', 'DIFF-01 爐管溫度維持在 recipe band')
    .replace('MES dispatch list synchronized for priority lots', 'MES priority lots 派工清單已同步')
}
</script>

<style scoped>
.event-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.log-row {
  display: grid;
  grid-template-columns: 68px 58px 78px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  border-left: 3px solid transparent;
  border-radius: 8px;
  background: var(--app-surface-soft);
  padding: 9px 10px;
  font-size: 12px;
}

.log-row--ok { border-left-color: #16a34a; }
.log-row--warn { border-left-color: #d97706; }
.log-row--error { border-left-color: #dc2626; }

.log-time,
.machine-id {
  color: var(--n-text-color-3);
  font-family: var(--n-font-family-mono);
  font-size: 11px;
}

.level-tag {
  min-width: 48px;
  justify-content: center;
}

.log-msg {
  color: var(--n-text-color-2);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.log-enter-active { transition: all 0.22s ease; }
.log-enter-from { opacity: 0; transform: translateY(-8px); }

@media (max-width: 700px) {
  .log-row {
    grid-template-columns: 64px 54px minmax(0, 1fr);
  }

  .machine-id {
    display: none;
  }
}
</style>
