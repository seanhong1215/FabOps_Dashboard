<template>
  <main class="alarm-center">
    <section class="alarm-hero">
      <div>
        <span class="section-kicker">告警中心</span>
        <h1>告警中心與異常處置</h1>
        <p>
          彙整設備異常、瓶頸風險與即時事件，協助值班主管快速判斷優先級、責任單位與下一步處置。
        </p>
      </div>

      <div class="hero-actions">
        <div>
          <span>未處理</span>
          <strong>{{ openAlarmCount }}</strong>
        </div>
        <div>
          <span>高優先</span>
          <strong>{{ highPriorityCount }}</strong>
        </div>
        <div>
          <span>平均回應</span>
          <strong>04m</strong>
        </div>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card summary-card--critical">
        <span>高優先告警</span>
        <strong>{{ severityCounts.high }}</strong>
        <em>立即派工</em>
      </div>
      <div class="summary-card summary-card--warning">
        <span>中優先告警</span>
        <strong>{{ severityCounts.medium }}</strong>
        <em>班內追蹤</em>
      </div>
      <div class="summary-card summary-card--normal">
        <span>低優先告警</span>
        <strong>{{ severityCounts.low }}</strong>
        <em>持續監控</em>
      </div>
      <div class="summary-card">
        <span>受影響 WIP</span>
        <strong>{{ impactedQueue }}</strong>
        <em>lots</em>
      </div>
    </section>

    <section class="alarm-layout">
      <div class="alarm-table-panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">即時佇列</span>
            <h2>即時告警清單</h2>
          </div>
          <span class="updated">更新 {{ store.lastUpdated || '--:--:--' }}</span>
        </div>

        <div class="toolbar">
          <n-input
            v-model:value="search"
            clearable
            placeholder="搜尋設備、區域或告警內容"
          />
          <n-select
            v-model:value="severityFilter"
            :options="severityOptions"
            class="filter-select"
          />
          <n-select
            v-model:value="statusFilter"
            :options="statusOptions"
            class="filter-select"
          />
        </div>

        <div class="alarm-list">
          <article
            v-for="alarm in filteredAlarms"
            :key="alarm.id"
            class="alarm-row"
            :class="`alarm-row--${alarm.severity}`"
          >
            <div class="alarm-priority">
              <span class="priority-light" />
              <strong>{{ severityLabel(alarm.severity) }}</strong>
              <small>{{ alarm.status === 'open' ? '未處理' : '已確認' }}</small>
            </div>
            <div class="alarm-main">
              <div class="alarm-title">
                <strong>{{ alarm.title }}</strong>
                <n-tag :type="alarmTagType(alarm.severity)" size="small" round>
                  {{ alarm.area }}
                </n-tag>
              </div>
              <p>{{ alarm.message }}</p>
              <div class="alarm-meta">
                <span>{{ alarm.time }}</span>
                <span>{{ alarm.machineId }}</span>
                <span>責任：{{ alarm.owner }}</span>
                <span>WIP {{ alarm.queue }} lots</span>
              </div>
            </div>
            <div class="alarm-action">
              <span>{{ alarm.recommendation }}</span>
            </div>
          </article>

          <div v-if="filteredAlarms.length === 0" class="empty-state">
            目前沒有符合條件的告警。
          </div>
        </div>
      </div>

      <aside class="timeline-panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">事件時間線</span>
            <h2>事件時間線</h2>
          </div>
        </div>

        <div class="timeline">
          <div
            v-for="entry in store.logs.slice(0, 8)"
            :key="entry.id"
            class="timeline-item"
            :class="`timeline-item--${entry.level}`"
          >
            <span>{{ entry.timestamp }}</span>
            <strong>{{ entry.machineId ?? 'SYSTEM' }}</strong>
            <p>{{ translateLog(entry.message) }}</p>
          </div>
        </div>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { NInput, NSelect, NTag } from 'naive-ui'
import { useEquipmentStore } from '@/stores/equipment'
import { useWebSocket } from '@/composables/useWebSocket'
import type { Machine } from '@/types/equipment'

type AlarmSeverity = 'high' | 'medium' | 'low'
type AlarmStatus = 'open' | 'acknowledged'
type FilterValue = 'all' | AlarmSeverity | AlarmStatus

interface AlarmItem {
  id: string
  machineId: string
  area: string
  owner: string
  queue: number
  time: string
  severity: AlarmSeverity
  status: AlarmStatus
  title: string
  message: string
  recommendation: string
}

const store = useEquipmentStore()
useWebSocket()

const search = ref('')
const severityFilter = ref<FilterValue>('all')
const statusFilter = ref<FilterValue>('all')

const severityOptions = [
  { label: '全部優先級', value: 'all' },
  { label: '高優先', value: 'high' },
  { label: '中優先', value: 'medium' },
  { label: '低優先', value: 'low' },
]

const statusOptions = [
  { label: '全部狀態', value: 'all' },
  { label: '未處理', value: 'open' },
  { label: '已確認', value: 'acknowledged' },
]

const alarms = computed<AlarmItem[]>(() => {
  const machineAlarms = store.machines
    .filter(machine => machine.status !== 'running' || machine.wph / machine.targetWph < 0.85)
    .map(machineToAlarm)

  const processAlarm: AlarmItem = {
    id: 'process-cvd-window',
    machineId: 'CVD-01',
    area: 'Thin Film',
    owner: 'Team Alpha',
    queue: store.machineById('CVD-01')?.queue ?? 0,
    time: store.lastUpdated || '--:--:--',
    severity: 'low',
    status: 'acknowledged',
    title: 'CVD 製程視窗接近管制上限',
    message: '壓力與氣體流量仍在管制線內，需持續監看趨勢避免 drift 擴大。',
    recommendation: '維持現行 recipe，若壓力超過 4.7 mTorr 則通知製程值班。',
  }

  return [...machineAlarms, processAlarm]
})

const filteredAlarms = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return alarms.value.filter(alarm => {
    const matchesSeverity = severityFilter.value === 'all' || alarm.severity === severityFilter.value
    const matchesStatus = statusFilter.value === 'all' || alarm.status === statusFilter.value
    const text = `${alarm.machineId} ${alarm.area} ${alarm.owner} ${alarm.title} ${alarm.message}`.toLowerCase()
    return matchesSeverity && matchesStatus && (!keyword || text.includes(keyword))
  })
})

const severityCounts = computed(() => ({
  high: alarms.value.filter(alarm => alarm.severity === 'high').length,
  medium: alarms.value.filter(alarm => alarm.severity === 'medium').length,
  low: alarms.value.filter(alarm => alarm.severity === 'low').length,
}))

const openAlarmCount = computed(() =>
  alarms.value.filter(alarm => alarm.status === 'open').length
)

const highPriorityCount = computed(() => severityCounts.value.high)

const impactedQueue = computed(() =>
  alarms.value.reduce((sum, alarm) => sum + alarm.queue, 0)
)

function machineToAlarm(machine: Machine): AlarmItem {
  const throughputRatio = machine.wph / machine.targetWph
  const isDown = machine.status === 'error'
  const isIdle = machine.status === 'idle'
  const severity: AlarmSeverity = isDown ? 'high' : isIdle || throughputRatio < 0.5 ? 'medium' : 'low'

  return {
    id: `machine-${machine.id}`,
    machineId: machine.id,
    area: machine.area,
    owner: machine.owner,
    queue: machine.queue,
    time: store.lastUpdated || '--:--:--',
    severity,
    status: isDown || isIdle ? 'open' : 'acknowledged',
    title: alarmTitle(machine, severity),
    message: alarmMessage(machine),
    recommendation: alarmRecommendation(machine, severity),
  }
}

function alarmTitle(machine: Machine, severity: AlarmSeverity): string {
  if (machine.status === 'error') return `${machine.name} 設備停機`
  if (machine.status === 'idle') return `${machine.name} 待料或釋放條件未完成`
  if (severity === 'medium') return `${machine.name} 產能缺口擴大`
  return `${machine.name} 產出低於 target`
}

function alarmMessage(machine: Machine): string {
  const gap = machine.targetWph - machine.wph
  if (machine.status === 'error') {
    return `錯誤碼 ${machine.errorCode ?? 'N/A'}，已影響 ${machine.queue} lots，downtime 持續累積。`
  }
  if (machine.status === 'idle') {
    return `目前 WPH 為 0，需確認物料、recipe release 或前站供料狀態。`
  }
  return `目前低於 target ${gap} WPH，若持續 15 分鐘將影響線平衡。`
}

function alarmRecommendation(machine: Machine, severity: AlarmSeverity): string {
  if (severity === 'high') return '立即通知設備工程師，暫停派工至此 tool。'
  if (machine.status === 'idle') return '確認 release 條件並調整 dispatch priority。'
  return '持續監控 3 個 tick，必要時切換備援設備。'
}

function severityLabel(severity: AlarmSeverity): string {
  const map: Record<AlarmSeverity, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return map[severity]
}

function alarmTagType(severity: AlarmSeverity): 'error' | 'warning' | 'info' {
  if (severity === 'high') return 'error'
  if (severity === 'medium') return 'warning'
  return 'info'
}

function translateLog(message: string): string {
  return message
    .replace('Demo realtime stream started', '展示用即時串流已啟動')
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
.alarm-center {
  width: min(1480px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0 42px;
}

.alarm-hero,
.summary-card,
.alarm-table-panel,
.timeline-panel {
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.alarm-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 520px);
  gap: 24px;
  align-items: end;
  min-height: 238px;
  border-radius: 18px;
  background: var(--app-hero-bg);
  margin-bottom: 14px;
  padding: 34px;
}

.alarm-hero h1 {
  max-width: 760px;
  margin: 12px 0;
  color: var(--app-hero-text);
  font-size: clamp(34px, 5vw, 60px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 0.98;
}

.alarm-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--app-hero-muted);
  font-size: 16px;
  line-height: 1.65;
}

.hero-actions,
.summary-grid {
  display: grid;
  gap: 10px;
}

.hero-actions {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.hero-actions div,
.summary-card {
  border-radius: 12px;
  background: var(--app-surface);
  padding: 14px;
}

.hero-actions div {
  border: 1px solid var(--app-border);
}

.hero-actions span,
.summary-card span,
.summary-card em,
.section-kicker,
.updated,
.alarm-meta,
.alarm-priority small {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-actions strong,
.summary-card strong {
  display: block;
  margin-top: 10px;
  color: var(--n-text-color-1);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.summary-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
}

.summary-card {
  background: var(--app-surface);
}

.summary-card--critical { border-top: 3px solid #dc2626; }
.summary-card--warning { border-top: 3px solid #d97706; }
.summary-card--normal { border-top: 3px solid #16a34a; }

.summary-card em {
  display: block;
  margin-top: 8px;
  font-style: normal;
}

.alarm-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 14px;
}

.alarm-table-panel,
.timeline-panel {
  border-radius: 14px;
  background: var(--app-surface);
  padding: 20px;
}

.timeline-panel {
  align-self: start;
  position: sticky;
  top: 82px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 4px 0 0;
  color: var(--n-text-color-1);
  font-size: 18px;
  font-weight: 850;
  letter-spacing: 0;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 160px 160px;
  gap: 10px;
  margin-bottom: 14px;
}

.alarm-list {
  display: grid;
  gap: 10px;
}

.alarm-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 260px;
  gap: 14px;
  align-items: stretch;
  border: 1px solid var(--app-border);
  border-left-width: 4px;
  border-radius: 12px;
  background: var(--app-surface-soft);
  padding: 14px;
}

.alarm-row--high { border-left-color: #dc2626; }
.alarm-row--medium { border-left-color: #d97706; }
.alarm-row--low { border-left-color: #2563eb; }

.alarm-priority {
  display: grid;
  align-content: center;
  justify-items: start;
  gap: 6px;
}

.priority-light {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.14);
}

.alarm-row--high .priority-light {
  background: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.16);
  animation: alarm-blink 1.1s ease-in-out infinite;
}

.alarm-row--medium .priority-light {
  background: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.14);
}

.alarm-priority strong {
  color: var(--n-text-color-1);
  font-size: 26px;
  font-weight: 900;
}

.alarm-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.alarm-title strong {
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 900;
}

.alarm-main p,
.alarm-action span,
.timeline-item p {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.5;
}

.alarm-main p {
  margin: 8px 0 10px;
}

.alarm-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.alarm-action {
  display: grid;
  align-content: center;
  border-radius: 10px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  padding: 12px;
}

.timeline {
  display: grid;
  gap: 10px;
}

.timeline-item {
  border-left: 3px solid #2563eb;
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 11px 12px;
}

.timeline-item--warn { border-left-color: #d97706; }
.timeline-item--error { border-left-color: #dc2626; }
.timeline-item--ok { border-left-color: #16a34a; }

.timeline-item span {
  color: var(--n-text-color-3);
  font-family: var(--n-font-family-mono);
  font-size: 11px;
}

.timeline-item strong {
  display: block;
  margin-top: 4px;
  color: var(--n-text-color-1);
  font-size: 13px;
}

.timeline-item p {
  margin: 5px 0 0;
}

.empty-state {
  border: 1px dashed var(--app-border-strong);
  border-radius: 12px;
  color: var(--n-text-color-3);
  padding: 28px;
  text-align: center;
}

@keyframes alarm-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (max-width: 1180px) {
  .alarm-hero,
  .alarm-layout {
    grid-template-columns: 1fr;
  }

  .timeline-panel {
    position: static;
  }
}

@media (max-width: 820px) {
  .alarm-center {
    width: min(100% - 24px, 1480px);
    padding: 14px 0 86px;
  }

  .alarm-hero {
    padding: 24px;
  }

  .hero-actions,
  .summary-grid,
  .toolbar,
  .alarm-row {
    grid-template-columns: 1fr;
  }

  .filter-select {
    width: 100%;
  }

  .section-header,
  .alarm-title {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
